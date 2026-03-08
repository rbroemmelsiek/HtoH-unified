import { createAsyncThunk, ThunkAction } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './store';
import { PlanRow } from '../../types/planApp/planRow';
import { findBranch, makeShortRow } from './helpers/familyFunctions';
import {
  updateElementLocal,
  updateElementsListLocal,
  updateCounterElementsList,
  elAddNew,
  elDelete,
  reSortFamily,
  removeFromFamily,
  addToFamily,
  setTree,
  setName,
  setAppReady,
  setTreeError,
  elStartUpdate,
  elCommit,
  setUnsubscribe,
  resetTreeError,
} from './planAppSlice';

// Helper types for thunk return values
type ThunkResult<R> = ThunkAction<R, RootState, unknown, any>;

import planGateway from '../../services/planGateway/planGateway';

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

// Helper functions (will need to be imported/adapted)
function getCachedPlan(): any {
  // TODO: Implement or import from helpers
  throw new Error('getCachedPlan not implemented');
}

function getLoadErrorMsg(planName: string): string {
  return `Failed to load ${planName}`;
}

function getSaveErrorMsg(elementName: string): string {
  return `Failed to save ${elementName}`;
}

function formatLoadBenchmarkLabel(params: any): string {
  return `load-${params.mode}-${params.owner}-${params.keyId}`;
}

function endLoadBenchmark(label: string, data: any): void {
  // Performance logging - can be implemented later
}

function failLoadBenchmark(label: string, data: any): void {
  // Performance logging - can be implemented later
}

// Thunk: Reset app ready state
export const resetAppReadyState = (): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(setAppReady(false));
    dispatch(resetTreeError());
  };
};

// Thunk: Get plan (with Firebase subscription)
export const getPlan = createAsyncThunk(
  'planApp/getPlan',
  async (_, { dispatch, getState }) => {
    const state = getState().planApp;
    
    // Unsubscribe from previous subscription if exists
    if (state.unsubscribe) {
      state.unsubscribe();
      dispatch(setUnsubscribe(null));
    }

    await dispatch(resetAppReadyState());

    // Get appMode from state
    const appMode = state.mode === 'main' ? 'plan' : state.mode;
    const action = `plan_${appMode}_get`;

    try {
      console.log('[PlanApp] Fetching plan:', {
        action,
        planId: state.plan,
        owner: state.owner,
        keyId: state.keyId,
        sessionType: state.sessionType,
      });
      
            __agentLog('H3','planAppThunks.ts:subscribe','planGateway.subscribe',{action, plan: state.plan, owner: state.owner});
const unsubscribe = await planGateway.subscribe(
        action,
        {
          keyId: state.keyId,
          plan: state.plan,
          sessionType: state.sessionType,
          owner: state.owner,
        },
        (response) => {
          console.log('[PlanApp] Plan data received:', {
            hasRoot: !!response?.root,
            childrenCount: response?.root?.children?.length || 0,
            planName: response?.name,
          });
          dispatch(handleFetchResponse({ response }));
        }
      );

      dispatch(setUnsubscribe(unsubscribe));
    } catch (error) {
            __agentLog('H3','planAppThunks.ts:onError','subscribe failed',{error: String(error)});
console.error('[PlanApp] Failed to subscribe to plan:', error);
      await dispatch(handleFetchError());
    }
  }
);

// Thunk: Get plan from cache
export const getPlanCached = createAsyncThunk(
  'planApp/getPlanCached',
  async (_, { dispatch }) => {
    await dispatch(resetAppReadyState());
    try {
      const response = getCachedPlan();
      await dispatch(handleFetchResponse({ response }));
    } catch (e) {
      await dispatch(handleFetchError());
    }
  }
);

// Thunk: Get template
export const getTemplate = createAsyncThunk(
  'planApp/getTemplate',
  async (_, { dispatch, getState }) => {
    const state = getState().planApp;
    await dispatch(resetAppReadyState());
    
    try {
      const response = await planGateway.fetch('plan_template_get', {
        owner: state.owner,
        plan: state.plan,
      });
      await dispatch(handleFetchResponse({ response }));
    } catch (e) {
      await dispatch(handleFetchError());
    }
  }
);

// Thunk: Handle fetch response
export const handleFetchResponse = createAsyncThunk(
  'planApp/handleFetchResponse',
  async (
    payload: { response: any },
    { dispatch, getState }
  ) => {
    const state = getState().planApp;
    const { response } = payload;

    if (!response?.root?.children.length) {
      // Don't error on empty plan, it might be new
    }

    const children = response?.root?.children || [];

    dispatch(setName(response?.name || ''));
    dispatch(setTree(children));
    dispatch(setAppReady(true));

    // Calculate task counts for all panels after plan loads
    // This is required for navbar to display
    const calculateTaskCounts = (rows: PlanRow[]) => {
      rows.forEach((row: PlanRow) => {
        if (row.type === 'panel') {
          // Count all checkboxes in this panel recursively
          const countCheckboxes = (r: PlanRow): number => {
            let count = 0;
            if (r.type === 'checkbox') {
              count = 1;
            }
            if (r.children && r.children.length > 0) {
              r.children.forEach((child) => {
                count += countCheckboxes(child);
              });
            }
            return count;
          };

          const totalTasks = countCheckboxes(row);
          row.totalTasks = totalTasks;
          
          // Count done tasks
          const countDoneTasks = (r: PlanRow): number => {
            let count = 0;
            if (r.type === 'checkbox' && r.checked === 1) {
              count = 1;
            }
            if (r.children && r.children.length > 0) {
              r.children.forEach((child) => {
                count += countDoneTasks(child);
              });
            }
            return count;
          };

          const doneTasks = countDoneTasks(row);
          row.doneTasks = doneTasks;
        }
        
        // Recursively calculate for children
        if (row.children && row.children.length > 0) {
          calculateTaskCounts(row.children);
        }
      });
    };

    calculateTaskCounts(children);

    const label = formatLoadBenchmarkLabel({
      mode: state.mode,
      owner: state.owner,
      keyId: state.keyId,
    });
    endLoadBenchmark(label, { rows: children.length });
  }
);

// Thunk: Handle fetch error
export const handleFetchError = createAsyncThunk(
  'planApp/handleFetchError',
  async (_, { dispatch, getState }) => {
    const state = getState().planApp;
    const errorMsg = getLoadErrorMsg(state.plan + ' plan');
    dispatch(setTreeError(errorMsg));

    const label = formatLoadBenchmarkLabel({
      mode: state.mode,
      owner: state.owner,
      keyId: state.keyId,
    });
    failLoadBenchmark(label, { reason: 'fetch-error' });
  }
);

// Thunk: Row move (drag and drop within same parent)
export const rowMove = createAsyncThunk(
  'planApp/rowMove',
  async (
    payload: {
      parent?: PlanRow;
      el: PlanRow;
      update: [string, any][];
    },
    { dispatch, getState }
  ) => {
    const state = getState().planApp;
    const family = payload.parent ? payload.parent.children : state.root.children;
    const el = payload.el;
    const properties = payload.update;

    dispatch(elStartUpdate());
    dispatch(updateElementLocal({ el, update: properties }));
    
    const newPos = properties[0][1];
    dispatch(
      reSortFamily({
        family,
        oldPos: el.pos,
        newPos,
      })
    );

    // TODO: Get appMode from selector
    const appMode = state.mode === 'main' ? 'plan' : state.mode;
    const action = `plan_${appMode}_row_move`;

    try {
      const response = await planGateway.post(action, {
        owner: state.owner,
        plan: state.plan,
        keyId: state.keyId,
        sessionType: state.sessionType,
        row: makeShortRow(el),
      });
      await dispatch(handlePostResponse({ el, result: response.result }));
    } catch (e) {
      await dispatch(handlePostError({ el }));
    }
  }
);

// Thunk: Row move out (drag and drop to different parent)
export const rowMoveOut = createAsyncThunk(
  'planApp/rowMoveOut',
  async (
    payload: {
      dst: PlanRow;
      el: PlanRow;
      oldParent: PlanRow;
      update: [string, any][];
    },
    { dispatch, getState }
  ) => {
    const state = getState().planApp;
    const { dst, el, oldParent, update } = payload;

    const newParent = findBranch(state.root, dst);
    if (!newParent) {
      return false;
    }
    const newFamily = newParent.children;
    const oldFamily = oldParent.children;

    dispatch(removeFromFamily({ family: oldFamily, oldPos: el.pos }));
    dispatch(updateElementLocal({ el, update }));
    dispatch(addToFamily({ family: newFamily, el }));
    dispatch(elStartUpdate());

    // TODO: Get appMode from selector
    const appMode = state.mode === 'main' ? 'plan' : state.mode;
    const action = `plan_${appMode}_row_move_out`;

    try {
      const response = await planGateway.post(action, {
        owner: state.owner,
        plan: state.plan,
        keyId: state.keyId,
        sessionType: state.sessionType,
        row: makeShortRow(el),
      });
      await dispatch(handlePostResponse({ el, result: response.result }));
    } catch (e) {
      await dispatch(handlePostError({ el }));
    }
  }
);

// Thunk: Row update (save changes)
export const rowUpdate = createAsyncThunk(
  'planApp/rowUpdate',
  async (
    payload: { el: PlanRow; update: [string, any][] },
    { dispatch, getState }
  ) => {
    const state = getState().planApp;
    const { el, update } = payload;

    dispatch(elStartUpdate());
    dispatch(updateElementLocal({ el, update }));

    // TODO: Get appMode from selector
    const appMode = state.mode === 'main' ? 'plan' : state.mode;
    const action = `plan_${appMode}_row_update`;

    try {
      const response = await planGateway.post(action, {
        owner: state.owner,
        plan: state.plan,
        keyId: state.keyId,
        sessionType: state.sessionType,
        row: makeShortRow(el),
      });
      await dispatch(handlePostResponse({ el, result: response.result }));
    } catch (e) {
      await dispatch(handlePostError({ el }));
    }
  }
);

// Thunk: Row delete
export const rowDelete = createAsyncThunk(
  'planApp/rowDelete',
  async (
    payload: { el: PlanRow; family?: PlanRow[] },
    { dispatch, getState }
  ) => {
    const state = getState().planApp;
    const { el, family = state.root.children } = payload;

    dispatch(elStartUpdate());

    dispatch(
      reSortFamily({
        family,
        oldPos: el.pos,
        newPos: 100 * 100, // Move to end before deleting
      })
    );

    dispatch(elDelete({ family, el }));

    // TODO: Get appMode from selector
    const appMode = state.mode === 'main' ? 'plan' : state.mode;
    const action = `plan_${appMode}_row_delete`;

    try {
      const response = await planGateway.post(action, {
        owner: state.owner,
        plan: state.plan,
        keyId: state.keyId,
        sessionType: state.sessionType,
        eid: el.eid,
        loaded: state.loaded,
        row: makeShortRow(el),
      });
      await dispatch(handlePostResponse({ el, result: response.result }));
    } catch (e) {
      await dispatch(handlePostError({ el }));
    }
  }
);

// Thunk: Handle post response
export const handlePostResponse = createAsyncThunk(
  'planApp/handlePostResponse',
  async (
    payload: { result?: number; el: PlanRow },
    { dispatch }
  ) => {
    if (payload.result === 1) {
      dispatch(elCommit());
    } else {
      await dispatch(handlePostError({ el: payload.el }));
    }
  }
);

// Thunk: Handle post error
export const handlePostError = createAsyncThunk(
  'planApp/handlePostError',
  async (payload: { el: PlanRow }, { dispatch }) => {
    const errorMsg = getSaveErrorMsg(payload.el.name);
    dispatch(setTreeError(errorMsg));
  }
);

// Thunk: Update element local recursive
export const updateElementLocalRecursive = (
  payload: { el: PlanRow }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(updateElementLocal({ el: payload.el, update: [] }));

    for (const child of payload.el.children) {
      dispatch(updateElementLocalRecursive({ el: child }));
    }
  };
};

// Thunk: Set panel comments count
export const setPanelCommentsCount = (
  payload: { panel: PlanRow; action: 'inc' | 'dec'; eid: string }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(
      updateCounterElementsList({
        elements: [payload.panel],
        action: payload.action,
        counterName: 'commentsCount',
        eid: payload.eid,
      })
    );
  };
};

// Thunk: Set unread comments count recursive
export const setUnreadCommentsCountRecursive = (
  payload: { parents: PlanRow[]; action: 'inc' | 'dec'; eid: string }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(
      updateCounterElementsList({
        elements: payload.parents,
        action: payload.action,
        counterName: 'unreadCommentsCount',
        eid: payload.eid,
      })
    );
  };
};

// Thunk: Set enabled what's next count recursive
export const setEnabledWhatsNextCountRecursive = (
  payload: { parents: PlanRow[]; action: 'inc' | 'dec'; eid: string }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(
      updateCounterElementsList({
        elements: payload.parents,
        action: payload.action,
        counterName: 'enabledWhatsNextCount',
        eid: payload.eid,
      })
    );
  };
};

// Thunk: Set local enabled what's next count recursive
export const setLocalEnabledWhatsNextCountRecursive = (
  payload: { parents: PlanRow[]; action: 'inc' | 'dec'; eid: string }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(
      updateCounterElementsList({
        elements: payload.parents,
        action: payload.action,
        counterName: 'localEnabledWhatsNextCount',
        eid: payload.eid,
      })
    );
  };
};

// Thunk: Set total panel tasks count
export const setTotalPanelTasksCount = (
  payload: { panel: PlanRow; action: 'inc' | 'dec'; eid: string }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(
      updateCounterElementsList({
        elements: [payload.panel],
        action: payload.action,
        counterName: 'totalTasks',
        eid: payload.eid,
      })
    );
  };
};

// Thunk: Set local total panel tasks count
export const setLocalTotalPanelTasksCount = (
  payload: { panel: PlanRow; action: 'inc' | 'dec'; eid: string }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(
      updateCounterElementsList({
        elements: [payload.panel],
        action: payload.action,
        counterName: 'localTotalTasks',
        eid: payload.eid,
      })
    );
  };
};

// Thunk: Set done panel tasks count
export const setDonePanelTasksCount = (
  payload: { panel: PlanRow; action: 'inc' | 'dec'; eid: string }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(
      updateCounterElementsList({
        elements: [payload.panel],
        action: payload.action,
        counterName: 'doneTasks',
        eid: payload.eid,
      })
    );
  };
};

// Thunk: Set local done panel tasks count
export const setLocalDonePanelTasksCount = (
  payload: { panel: PlanRow; action: 'inc' | 'dec'; eid: string }
): ThunkResult<void> => {
  return (dispatch) => {
    dispatch(
      updateCounterElementsList({
        elements: [payload.panel],
        action: payload.action,
        counterName: 'localDoneTasks',
        eid: payload.eid,
      })
    );
  };
};

// Thunk: Row add
export const rowAdd = (
  payload: {
    family: PlanRow[];
    el: PlanRow;
    oldPos?: number;
    newPos?: number;
    forceUp?: boolean;
    parentEid?: string;
  }
): ThunkResult<void> => {
  return (dispatch, getState) => {
    const state = getState().planApp;
    const family = payload.family || state.root.children;
    const el = payload.el;
    
    // Determine parentEid for finding family in state
    let parentEid: string | undefined = payload.parentEid;
    if (!parentEid) {
      // If family is root.children, parentEid is 'root'
      if (family === state.root.children) {
        parentEid = 'root';
      } else if (family.length > 0 && family[0].pid) {
        // Try to find parent from first child's pid
        parentEid = family[0].pid === 'root' ? 'root' : undefined;
      }
    }

    const oldPos = payload.oldPos === undefined ? 100 * 100 : payload.oldPos;
    const newPos = payload.newPos === undefined ? 0 : payload.newPos;

    // Set the element's position before adding
    el.pos = newPos;
    
    dispatch(elAddNew({ family, el, parentEid }));
  };
};

// Thunk: Get new plan (reload from options element)
export const getNewPlan = (): ThunkResult<void> => {
  return (dispatch, getState) => {
    const state = getState().planApp;
    const el = document.getElementById('plan-app-options');

    // @ts-ignore
    const keyId = el?.dataset.keyid === '00' ? '0000000000000000' : el?.dataset.keyid;
    if (keyId && keyId !== state.keyId) {
      dispatch(setKey(keyId));
    }
  };
};

// Helper function for search (will need to be imported)
function isTermInString(term: string, haystack: string): boolean {
  return haystack.toLowerCase().includes(term.toLowerCase());
}

// Thunk: Highlight matching elements recursive
export const highlightMatchingElementsRecursive = (
  payload: { children?: PlanRow[] }
): ThunkResult<void> => {
  return (dispatch, getState) => {
    const state = getState().planApp;
    const children = payload.children || state.root.children;
    const searchTerm = state.searchString.toLowerCase();

    for (const child of children) {
      const haystacks = [
        child.name + child.link,
        child.tooltip,
        child.video_script || '',
      ];

      const [
        hasSearchTermName,
        hasSearchTermTooltip,
        hasSearchTermVideoScript,
      ] = haystacks.map((haystack) => isTermInString(searchTerm, haystack));

      dispatch(
        updateElementLocal({
          el: child,
          update: [
            [
              'filterMatch',
              hasSearchTermName ||
                hasSearchTermTooltip ||
                hasSearchTermVideoScript,
            ],
            ['highlightedName', hasSearchTermName],
            ['highlightedTooltip', hasSearchTermTooltip],
            ['highlightedVideo', hasSearchTermVideoScript],
          ],
        })
      );

      dispatch(highlightMatchingElementsRecursive({ children: child.children }));
    }
  };
};

// Thunk: Clear search highlights recursive
export const clearSearchHighlightsRecursive = (
  payload: { children?: PlanRow[] }
): ThunkResult<void> => {
  return (dispatch, getState) => {
    const state = getState().planApp;
    const children = payload.children || state.root.children;

    for (const child of children) {
      dispatch(
        updateElementLocal({
          el: child,
          update: [
            ['filterMatch', false],
            ['highlightedName', false],
            ['highlightedTooltip', false],
            ['highlightedVideo', false],
            ['opened', false],
          ],
        })
      );

      dispatch(clearSearchHighlightsRecursive({ children: child.children }));
    }
  };
};
