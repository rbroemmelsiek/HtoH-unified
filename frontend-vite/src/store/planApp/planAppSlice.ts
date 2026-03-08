import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlanAppState, initialState } from '../../types/planApp/planAppState';
import { PlanRow } from '../../types/planApp/planRow';
import { findFamilyMemberPos } from './helpers/familyFunctions';

/**
 * Extracts the 'opened' state from all rows in a tree into a Map.
 * Used to preserve UI state when the tree is replaced during Firebase sync.
 */
function extractOpenedStates(
  rows: PlanRow[],
  map: Map<string, boolean> = new Map()
): Map<string, boolean> {
  for (const row of rows) {
    if (row.opened !== undefined) {
      map.set(row.eid, row.opened);
    }
    if (row.children?.length) {
      extractOpenedStates(row.children, map);
    }
  }
  return map;
}

/**
 * Applies preserved 'opened' states to a new tree.
 * This ensures panels remain expanded after Firebase sync.
 */
function applyOpenedStates(
  rows: PlanRow[],
  openedMap: Map<string, boolean>
): void {
  for (const row of rows) {
    if (openedMap.has(row.eid)) {
      row.opened = openedMap.get(row.eid);
    }
    if (row.children?.length) {
      applyOpenedStates(row.children, openedMap);
    }
  }
}

const planAppSlice = createSlice({
  name: 'planApp',
  initialState,
  reducers: {
    init(state: PlanAppState, action: PayloadAction<{
      planId?: string;
      ownerId?: string | number;
      mode?: string;
      sessionType?: string;
      showNav?: boolean;
      keyId?: string;
    }>) {
      const options = action.payload;
      
      // Check URL parameters (useful for iframe embedding)
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for plan-app-options element
      const el = document.getElementById("plan-app-options");

      state.keyId = options.keyId || urlParams.get('keyid') || (el?.dataset.keyid || "");
      state.mode = options.mode || urlParams.get('page') || (el?.dataset.page ? el.dataset.page.toLowerCase() : "");
      
      // Handle owner="0" correctly
      const ownerParam = urlParams.get('owner');
      if (options.ownerId !== undefined) {
        state.owner = Number(options.ownerId);
      } else if (ownerParam !== null) {
        state.owner = Number(ownerParam);
      } else if (el?.dataset.owner !== undefined && el.dataset.owner !== "") {
        state.owner = Number(el.dataset.owner);
      } else {
        state.owner = Infinity;
      }
      
      state.plan = options.planId || urlParams.get('plantype') || (el?.dataset.plantype ? el.dataset.plantype.toLowerCase() : "");
      state.sessionType = options.sessionType || urlParams.get('sessiontype') || (el?.dataset.sessiontype ? el.dataset.sessiontype.toLowerCase() : "");

      // useNav can be disabled via URL param ?nav=false or data-nav="false"
      const navParam = urlParams.get('nav');
      if (options.showNav !== undefined) {
        state.useNav = options.showNav;
      } else if (navParam !== null) {
        state.useNav = navParam !== 'false';
      } else {
        state.useNav = !(el?.dataset.nav && el.dataset.nav === "false");
      }

      state.showTitles = el?.dataset.showtitles ? el.dataset.showtitles !== "0" : true;
      state.editVideo = el?.dataset.editvideo ? el.dataset.editvideo === "1" : false;
      state.fakePanelsNumber = el?.dataset.fakepanels ? parseInt(el.dataset.fakepanels) : 8;
      state.useCached = el?.dataset.cached ? el.dataset.cached.toLowerCase() === "true" : false;
    },
    
    hideModal(state: PlanAppState) {
      state.modalVisible = false;
    },
    
    showVideoModal(state: PlanAppState, action: PayloadAction<{ src: string }>) {
      state.modalVisible = true;
      state.modalVideoSrc = action.payload.src;
    },
    
    setWindowResize(state: PlanAppState) {
      state.windowResizeFlag = Math.round(Math.random() * 1000);
    },
    
    setTopRowRecalc(
      state: PlanAppState,
      action: PayloadAction<{
        top: number;
        left: number;
        offsetHeight: number;
        offsetTop: number;
        offsetWidth: number;
      } | null>
    ) {
      state.topRowRecalc = action.payload;
    },
    
    setKey(state: PlanAppState, action: PayloadAction<string>) {
      state.keyId = action.payload;
    },
    
    setName(state: PlanAppState, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    
    setAppReady(state: PlanAppState, action: PayloadAction<boolean>) {
      state.isAppReady = action.payload;
    },
    
    setTreeError(state: PlanAppState, action: PayloadAction<string>) {
      state.name = "";
      state.root = { children: [] };
      state.treeError = true;
      state.treeErrorMsg = action.payload;
    },
    
    resetTreeError(state: PlanAppState) {
      state.treeErrorMsg = "";
      state.treeError = false;
      // Trigger reactivity by updating mode
      const oldMode = state.mode;
      state.mode = oldMode + "_";
      state.mode = oldMode;
    },
    
    setTree(state: PlanAppState, action: PayloadAction<PlanRow[]>) {
      // Preserve opened states from existing tree before replacing
      const openedStates = extractOpenedStates(state.root.children);

      // Apply preserved opened states to the new tree
      if (openedStates.size > 0) {
        applyOpenedStates(action.payload, openedStates);
      }

      state.root.children = action.payload;
      state.loaded = Math.floor(Date.now() / 1000);
    },
    
    elStartUpdate(state: PlanAppState) {
      state.saveCounter = state.saveCounter + 1;
    },
    
    elCommit(state: PlanAppState) {
      state.saveCounter = Math.max(0, state.saveCounter - 1);
    },
    
    updateElementLocal(
      state: PlanAppState,
      action: PayloadAction<{
        el: PlanRow;
        update: [string, any][];
      }>
    ) {
      const { el, update } = action.payload;
      
      // Helper to find element in state tree by eid
      const findElementInState = (eid: string, children: PlanRow[]): PlanRow | null => {
        for (const child of children) {
          if (child.eid === eid) {
            return child;
          }
          if (child.children.length > 0) {
            const found = findElementInState(eid, child.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      // Find the element in the state tree
      const stateElement = findElementInState(el.eid, state.root.children);
      
      if (!stateElement) {
        console.warn(`[updateElementLocal] Element ${el.eid} not found in state tree`);
        return;
      }
      
      // Now mutate the element in the state tree (Immer will handle immutability)
      for (const [propertyName, propertyValue] of update) {
        (stateElement as any)[propertyName] = propertyValue;
      }
    },
    
    updateElementsListLocal(
      state: PlanAppState,
      action: PayloadAction<{
        elements: PlanRow[];
        update: [string, any][];
      }>
    ) {
      const { elements, update } = action.payload;
      
      for (const element of elements) {
        for (const [propertyName, propertyValue] of update) {
          (element as any)[propertyName] = propertyValue;
        }
      }
    },
    
    updateCounterElementsList(
      state: PlanAppState,
      action: PayloadAction<{
        elements: PlanRow[];
        action: "inc" | "dec";
        eid: string;
        counterName: string;
      }>
    ) {
      const { elements, action: counterAction, eid, counterName } = action.payload;
      const listName = counterName + "List";

      for (const element of elements) {
        // @ts-ignore
        let elementsList: string[] = element[listName] ? [...element[listName]] : [];

        if (counterAction === "inc") {
          elementsList.push(eid);
          elementsList = [...new Set(elementsList)]; // remove duplicates
        }
        if (counterAction === "dec") {
          const foundId = elementsList.indexOf(eid);
          if (foundId > -1) {
            elementsList.splice(foundId, 1);
          }
        }

        // @ts-ignore
        element[listName] = elementsList;
        // @ts-ignore
        element[counterName] = elementsList.length;
      }
    },
    
    elAddNew(
      state: PlanAppState,
      action: PayloadAction<{ family: PlanRow[]; el: PlanRow; parentEid?: string }>
    ) {
      const { family, el, parentEid } = action.payload;
      
      // Helper to find family in state tree
      const findFamilyInState = (parentEid: string | undefined): PlanRow[] | null => {
        if (!parentEid || parentEid === 'root') {
          return state.root.children;
        }
        
        // Recursive search for the parent element
        const findElement = (children: PlanRow[]): PlanRow | null => {
          for (const child of children) {
            if (child.eid === parentEid) {
              return child;
            }
            if (child.children.length > 0) {
              const found = findElement(child.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        const parent = findElement(state.root.children);
        return parent ? parent.children : null;
      };
      
      // Try to find the family in state tree
      const stateFamily = parentEid ? findFamilyInState(parentEid) : 
                         (family === state.root.children ? state.root.children : null);
      
      if (stateFamily) {
        // Mutate the state family directly (Immer will handle it)
        stateFamily.splice(el.pos, 0, el);
      } else {
        // Fallback: try to mutate the provided family (might fail if frozen)
        try {
          family.splice(el.pos, 0, el);
        } catch (e) {
          console.warn('Could not mutate family array, element may not be added', e);
        }
      }
    },
    
    elDelete(
      state: PlanAppState,
      action: PayloadAction<{ family: PlanRow[]; el: PlanRow }>
    ) {
      const { family, el } = action.payload;
      const memberPos = findFamilyMemberPos(family, el.eid);
      if (memberPos !== Infinity) {
        family.splice(memberPos, 1);
      }
    },
    
    addOpenedByNav(state: PlanAppState, action: PayloadAction<string>) {
      state.openedByNav = action.payload;
    },
    
    setNavStepHovered(state: PlanAppState, action: PayloadAction<string>) {
      state.navStepHovered = action.payload;
    },
    
    removeOpenedByNav(state: PlanAppState) {
      state.openedByNav = "";
    },
    
    reSortFamily(
      state: PlanAppState,
      action: PayloadAction<{
        family: PlanRow[];
        oldPos: number;
        newPos: number;
        forceUp?: boolean;
      }>
    ) {
      let up = 1; // 1 - up, 0 - down
      const { family, oldPos, newPos, forceUp = false } = action.payload;

      if (newPos > oldPos && !forceUp) {
        up = 0;
      }
      
      family.forEach(function (child) {
        if (up && child.pos >= newPos && child.pos < oldPos) {
          child.pos++;
          return;
        }
        if (!up && child.pos > oldPos && child.pos <= newPos) {
          child.pos--;
          return;
        }
        if (child.pos === oldPos) {
          child.pos = newPos;
        }
      });

      family.sort(function (a, b) {
        return a.pos - b.pos;
      });
    },
    
    removeFromFamily(
      state: PlanAppState,
      action: PayloadAction<{ family: PlanRow[]; oldPos: number }>
    ) {
      const { family, oldPos } = action.payload;
      let index = Infinity;

      family.forEach((child, idx) => {
        if (child.pos > oldPos) {
          child.pos--;
          return;
        }
        if (child.pos === oldPos) {
          index = idx;
        }
      });

      if (index !== Infinity) {
        family.splice(index, 1);
      }
    },
    
    addToFamily(
      state: PlanAppState,
      action: PayloadAction<{ family: PlanRow[]; el: PlanRow }>
    ) {
      const { family, el } = action.payload;
      const newPos = el.pos;
      let pid = "";
      
      family.forEach((child) => {
        if (child.pos >= newPos) {
          child.pos++;
        }
        pid = child.pid;
      });

      el.pid = pid;
      family.push(el);

      family.sort(function (a, b) {
        return a.pos - b.pos;
      });
    },
    
    setSearchString(state: PlanAppState, action: PayloadAction<string>) {
      state.searchString = action.payload;
    },
    
    triggerSearch(state: PlanAppState) {
      state.searchTrigger = Math.random().toString();
    },
    
    setUnsubscribe(
      state: PlanAppState,
      action: PayloadAction<(() => void) | null>
    ) {
      state.unsubscribe = action.payload;
    },
  },
});

export const {
  init,
  hideModal,
  showVideoModal,
  setWindowResize,
  setTopRowRecalc,
  setKey,
  setName,
  setAppReady,
  setTreeError,
  resetTreeError,
  setTree,
  elStartUpdate,
  elCommit,
  updateElementLocal,
  updateElementsListLocal,
  updateCounterElementsList,
  elAddNew,
  elDelete,
  addOpenedByNav,
  setNavStepHovered,
  removeOpenedByNav,
  reSortFamily,
  removeFromFamily,
  addToFamily,
  setSearchString,
  triggerSearch,
  setUnsubscribe,
} = planAppSlice.actions;

export default planAppSlice.reducer;
