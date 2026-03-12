
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { PlanDocument, PlanRow, AddChildType } from '../types';
import { SAMPLE_PLAN } from '../constants';
import { clonePlan, findRowInTree, findFamily, getDummyElement, findParent, deleteRowFromTree, findPathToNode, normalizePlanRowIds } from '../utils/planHelpers';
import planGateway from '../../../services/planGateway/planGateway';
import { useAuth } from '../../../context/AuthContext';

interface PlanState {
  plan: PlanDocument;
  searchTerm: string;
  isSearchEnabled: boolean;
  hoveredRowId: string | null;
  draggedRowId: string | null;
  highlightedAncestors: string[];
  droppedRowId: string | null;
  aiMode: boolean;
  deleteConfirmation: { isOpen: boolean; rowId: string | null; };
  resetConfirmation: { isOpen: boolean; rowId: string | null; rowName: string | null; };
  videoModal: { isOpen: boolean; videoUrl: string | null; };
  settingsModal: { isOpen: boolean; rowId: string | null; };
}

const initialState: PlanState = {
  plan: SAMPLE_PLAN,
  searchTerm: '',
  isSearchEnabled: false,
  hoveredRowId: null,
  draggedRowId: null,
  highlightedAncestors: [],
  droppedRowId: null,
  aiMode: true,
  deleteConfirmation: { isOpen: false, rowId: null },
  resetConfirmation: { isOpen: false, rowId: null, rowName: null },
  videoModal: { isOpen: false, videoUrl: null },
  settingsModal: { isOpen: false, rowId: null },
};

type Action =
  | { type: 'INIT_PLAN'; payload: PlanDocument }
  | { type: 'SET_PLAN_NAME'; payload: string }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_HOVERED_ROW'; payload: string | null }
  | { type: 'SET_DRAGGED_ROW'; payload: string | null }
  | { type: 'SET_DROPPED_ROW'; payload: string | null }
  | { type: 'TOGGLE_OPEN'; payload: string }
  | { type: 'TOGGLE_ALL'; payload: boolean }
  | { type: 'SET_DESCENDANTS_OPEN'; payload: { eid: string; opened: boolean } }
  | { type: 'TOGGLE_VISIBLE'; payload: string }
  | { type: 'START_EDIT'; payload: string }
  | { type: 'FINISH_EDIT'; payload: { eid: string; name: string; link?: string } }
  | { type: 'CANCEL_EDIT'; payload: string }
  | { type: 'REQUEST_DELETE_ROW'; payload: string }
  | { type: 'CANCEL_DELETE' }
  | { type: 'CONFIRM_DELETE' }
  | { type: 'REQUEST_RESET_TASK'; payload: { eid: string; name: string } }
  | { type: 'CANCEL_RESET' }
  | { type: 'CONFIRM_RESET' }
  | { type: 'ADD_CHILD'; payload: { parentEid: string; type: AddChildType } }
  | { type: 'ADD_MULTIPLE_CHILDREN'; payload: { parentEid: string; children: { name: string, type: AddChildType, tooltip: string }[] } }
  | { type: 'CYCLE_TASK_STATUS'; payload: string }
  | { type: 'MOVE_ROW'; payload: { srcEid: string; destEid: string; position: 'before' | 'after' } }
  | { type: 'OPEN_VIDEO'; payload: string }
  | { type: 'CLOSE_VIDEO' }
  | { type: 'TOGGLE_AI_MODE' }
  | { type: 'OPEN_SETTINGS'; payload: string }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'UPDATE_ROW_SETTINGS'; payload: { eid: string; updates: Partial<PlanRow> } };

const planReducer = (state: PlanState, action: Action): PlanState => {
  switch (action.type) {
    case 'INIT_PLAN':
      return { ...state, plan: action.payload };

    case 'SET_PLAN_NAME':
      return {
        ...state,
        plan: {
          ...state.plan,
          name: action.payload,
        },
      };

    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, isSearchEnabled: action.payload.trim().length > 0 };
    
    case 'SET_HOVERED_ROW': return { ...state, hoveredRowId: action.payload };
    case 'SET_DRAGGED_ROW': return { ...state, draggedRowId: action.payload };
    case 'SET_DROPPED_ROW': return { ...state, droppedRowId: action.payload };

    case 'TOGGLE_OPEN': {
      const newPlan = clonePlan(state.plan);
      const row = findRowInTree(newPlan.root.children, action.payload);
      if (row) row.opened = !row.opened;
      return { ...state, plan: newPlan };
    }

    case 'TOGGLE_ALL': {
      const newPlan = clonePlan(state.plan);
      const setOpen = (rows: PlanRow[]) => {
        for (const r of rows) {
          r.opened = action.payload;
          if (r.children) setOpen(r.children);
        }
      };
      setOpen(newPlan.root.children);
      return { ...state, plan: newPlan };
    }

    case 'SET_DESCENDANTS_OPEN': {
      const newPlan = clonePlan(state.plan);
      const row = findRowInTree(newPlan.root.children, action.payload.eid);
      if (!row) return state;
      const setOpenDeep = (rows: PlanRow[]) => {
        for (const child of rows) {
          child.opened = action.payload.opened;
          if (child.children?.length) {
            setOpenDeep(child.children);
          }
        }
      };
      row.opened = action.payload.opened;
      if (row.children?.length) {
        setOpenDeep(row.children);
      }
      return { ...state, plan: newPlan };
    }

    case 'TOGGLE_VISIBLE': {
      const newPlan = clonePlan(state.plan);
      const row = findRowInTree(newPlan.root.children, action.payload);
      if (row) row.visible = !row.visible;
      return { ...state, plan: newPlan };
    }

    case 'START_EDIT': {
      const newPlan = clonePlan(state.plan);
      const clearAllEdits = (rows: PlanRow[]) => {
        for (const r of rows) {
          r.edit = false;
          if (r.children) clearAllEdits(r.children);
        }
      };
      clearAllEdits(newPlan.root.children);
      const row = findRowInTree(newPlan.root.children, action.payload);
      if (row) row.edit = true;
      return { ...state, plan: newPlan };
    }

    case 'FINISH_EDIT': {
      const newPlan = clonePlan(state.plan);
      const row = findRowInTree(newPlan.root.children, action.payload.eid);
      if (row) {
        row.edit = false;
        row.name = action.payload.name;
        if (action.payload.link !== undefined) row.link = action.payload.link;
        row.isNew = false;
      }
      return { ...state, plan: newPlan };
    }

    case 'CANCEL_EDIT': {
      const newPlan = clonePlan(state.plan);
      const row = findRowInTree(newPlan.root.children, action.payload);
      if (row) row.edit = false;
      return { ...state, plan: newPlan };
    }

    case 'REQUEST_DELETE_ROW': return { ...state, deleteConfirmation: { isOpen: true, rowId: action.payload } };
    case 'CANCEL_DELETE': return { ...state, deleteConfirmation: { isOpen: false, rowId: null } };
    case 'CONFIRM_DELETE': {
      if (!state.deleteConfirmation.rowId) return state;
      const newPlan = clonePlan(state.plan);
      deleteRowFromTree(newPlan.root.children, state.deleteConfirmation.rowId);
      return { ...state, plan: newPlan, deleteConfirmation: { isOpen: false, rowId: null } };
    }

    case 'REQUEST_RESET_TASK': return { ...state, resetConfirmation: { isOpen: true, rowId: action.payload.eid, rowName: action.payload.name } };
    case 'CANCEL_RESET': return { ...state, resetConfirmation: { isOpen: false, rowId: null, rowName: null } };
    case 'CONFIRM_RESET': {
      if (!state.resetConfirmation.rowId) return state;
      const newPlan = clonePlan(state.plan);
      const row = findRowInTree(newPlan.root.children, state.resetConfirmation.rowId);
      if (row) {
        row.checked = 0;
        row.date = null;
      }
      return { ...state, plan: newPlan, resetConfirmation: { isOpen: false, rowId: null, rowName: null } };
    }

    case 'CYCLE_TASK_STATUS': {
      const newPlan = clonePlan(state.plan);
      const row = findRowInTree(newPlan.root.children, action.payload);
      if (row && row.type === 'checkbox') {
        const next = (row.checked + 1) % 5;
        row.checked = next;
        if (next === 4) row.date = Math.floor(Date.now() / 1000).toString();
        else if (next === 0) row.date = null;
      }
      return { ...state, plan: newPlan };
    }

    case 'ADD_CHILD': {
      const newPlan = clonePlan(state.plan);
      const family = findFamily(newPlan.root, action.payload.parentEid);
      if (family) {
        const newRow = getDummyElement(action.payload.type, action.payload.parentEid, family.length);
        if (state.aiMode && action.payload.type !== 'panel') newRow.name = ''; 
        family.push(newRow);
        const parentRow = findRowInTree(newPlan.root.children, action.payload.parentEid);
        if (parentRow) parentRow.opened = true;
      }
      return { ...state, plan: newPlan };
    }

    case 'ADD_MULTIPLE_CHILDREN': {
      const newPlan = clonePlan(state.plan);
      const family = findFamily(newPlan.root, action.payload.parentEid);
      if (family) {
        action.payload.children.forEach((c, idx) => {
          const row = getDummyElement(c.type, action.payload.parentEid, family.length + idx);
          row.name = c.name;
          row.tooltip = c.tooltip;
          row.edit = false;
          row.isNew = true;
          family.push(row);
        });
        const parentRow = findRowInTree(newPlan.root.children, action.payload.parentEid);
        if (parentRow) parentRow.opened = true;
      }
      return { ...state, plan: newPlan };
    }

    case 'MOVE_ROW': {
      const newPlan = clonePlan(state.plan);
      const srcNode = findRowInTree(newPlan.root.children, action.payload.srcEid);
      if (!srcNode) return state;
      
      deleteRowFromTree(newPlan.root.children, action.payload.srcEid);
      const destFamily = findFamily(newPlan.root, action.payload.destEid === 'root' ? 'root' : findParent(newPlan.root, action.payload.destEid)?.children[0]?.pid || 'root');
      const destParent = findParent(newPlan.root, action.payload.destEid);
      const targetFamily = destParent ? destParent.children : newPlan.root.children;
      
      const idx = targetFamily.findIndex(r => r.eid === action.payload.destEid);
      if (idx !== -1) {
        const insertIdx = action.payload.position === 'before' ? idx : idx + 1;
        srcNode.pid = action.payload.destEid === 'root' ? 'root' : targetFamily[0].pid;
        targetFamily.splice(insertIdx, 0, srcNode);
      }
      return { ...state, plan: newPlan };
    }

    case 'TOGGLE_AI_MODE': return { ...state, aiMode: !state.aiMode };
    case 'OPEN_VIDEO': return { ...state, videoModal: { isOpen: true, videoUrl: action.payload } };
    case 'CLOSE_VIDEO': return { ...state, videoModal: { isOpen: false, videoUrl: null } };
    case 'OPEN_SETTINGS': return { ...state, settingsModal: { isOpen: true, rowId: action.payload } };
    case 'CLOSE_SETTINGS': return { ...state, settingsModal: { isOpen: false, rowId: null } };
    case 'UPDATE_ROW_SETTINGS': {
      const newPlan = clonePlan(state.plan);
      const row = findRowInTree(newPlan.root.children, action.payload.eid);
      if (row) Object.assign(row, action.payload.updates);
      return { ...state, plan: newPlan };
    }
    default: return state;
  }
};

const PlanContext = createContext<{ state: PlanState; dispatch: React.Dispatch<Action> } | undefined>(undefined);
export const PlanProvider = ({ children, planId, ownerId }: { children?: ReactNode; planId?: string; ownerId?: string }) => {
  const [state, dispatch] = useReducer(planReducer, initialState);
  const [activePlanId, setActivePlanId] = useState<string | undefined>(planId);
  const [hasLoadedPlan, setHasLoadedPlan] = useState(false);
  const { user, userProfile } = useAuth();

  const resolvedOwnerId = ownerId || user?.uid;
  const resolvedPlanId = userProfile?.currentPlanId || planId || undefined;

  useEffect(() => {
    setActivePlanId(resolvedPlanId);
  }, [resolvedPlanId]);

  // Load an existing plan document from the active gateway (local storage today, Firebase later).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const planDatasource = (process.env.NEXT_PUBLIC_PLAN_DATASOURCE || '').toLowerCase();
    const isFirebaseDatasource = planDatasource === 'firebase';

    // In Firebase mode, logged-out users cannot read owner-scoped plans.
    // Keep sample in-memory plan and skip gateway calls to prevent console permission errors.
    if (isFirebaseDatasource && !resolvedOwnerId) {
      setHasLoadedPlan(false);
      return;
    }

    let cancelled = false;
    setHasLoadedPlan(false);

    (async () => {
      try {
        const response = await planGateway.fetch('load', {
          planId: resolvedPlanId,
          uid: resolvedOwnerId,
        });
        if (cancelled || !response || !response.root) return;

        const loadedPlan: PlanDocument = {
          name: response.name || SAMPLE_PLAN.name,
          root: {
            children: response.root.children || [],
          },
        };
        normalizePlanRowIds(loadedPlan.root.children);

        dispatch({ type: 'INIT_PLAN', payload: loadedPlan });
        setActivePlanId(response.planId || resolvedPlanId);
        setHasLoadedPlan(true);
      } catch (e) {
        console.error('[PlanProvider] Failed to load plan from gateway', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedOwnerId, resolvedPlanId, user?.uid]);

  // Persist plan changes through the gateway (currently LocalPlanGateway → localStorage).
  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedPlan) return;

    planGateway
      .updatePlan({
        planId: activePlanId,
        name: state.plan.name,
        root: { children: state.plan.root.children },
      }, activePlanId, resolvedOwnerId)
      .catch((e) => {
        console.error('[PlanProvider] Failed to persist plan via gateway', e);
      });
  }, [activePlanId, hasLoadedPlan, resolvedOwnerId, state.plan]);

  return <PlanContext.Provider value={{ state, dispatch }}>{children}</PlanContext.Provider>;
};
export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan must be used within a PlanProvider');
  return context;
};
