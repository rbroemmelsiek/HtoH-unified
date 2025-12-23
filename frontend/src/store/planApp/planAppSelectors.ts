import { createSelector } from '@reduxjs/toolkit';
import { PlanAppState } from '../../types/planApp/planAppState';
import { NavStepType } from '../../types/planApp/navStep';
import { PlanRow } from '../../types/planApp/planRow';

// Helper function to strip shortcodes (simplified - may need full implementation)
function stripShortcodes(text: string): string {
  // Basic implementation - may need to match Vue version exactly
  return text.replace(/\[\[.*?\]\]/g, '').trim();
}

const selectPlanAppState = (state: { planApp: PlanAppState }) => state.planApp;

export const selectNavSteps = createSelector(
  [selectPlanAppState],
  (state): NavStepType[] => {
    const res: NavStepType[] = [];
    let n = 0;
    state.root.children.forEach(function (el: PlanRow) {
      const doneNumber = el.doneTasks !== undefined ? el.doneTasks : 0;
      const totalNumber = el.totalTasks !== undefined ? el.totalTasks : 0;
      let donePercent = 0;
      if (doneNumber !== 0 && totalNumber !== 0) {
        donePercent = doneNumber / totalNumber;
      }

      const wnCount = el.enabledWhatsNextCount !== undefined ? el.enabledWhatsNextCount : 0;
      let wnPercent = 0;
      if (wnCount !== 0 && totalNumber !== 0) {
        wnPercent = wnCount / totalNumber;
      }
      
      const step: NavStepType = {
        pid: el.eid,
        name: stripShortcodes(el.name).trim(),
        wnPercent: wnPercent,
        visible: el.visible,
        doneCount: doneNumber,
        wnCount,
        totalCount: el.totalTasks !== undefined ? el.totalTasks : 0,
        donePercent: donePercent,
        navOpened: state.openedByNav === el.eid,
        hovered: state.navStepHovered === el.eid,
        n: n,
        panel: el,
      };
      
      if (step.visible && step.totalCount) {
        res.push(step);
        n++;
      }
    });

    return res;
  }
);

export const selectSaveStatus = createSelector(
  [selectPlanAppState],
  (state) => {
    return state.saveCounter > 0 ? "in-progress" : "done";
  }
);

export const selectAmbassadorMode = createSelector(
  [selectPlanAppState],
  (state): boolean => {
    return state.sessionType === "agent" || state.sessionType === "lender";
  }
);

export const selectAppMode = createSelector(
  [selectPlanAppState],
  (state) => {
    switch (state.mode) {
      case "main":
        return "plan";
      case "template":
        return "template";
      case "widget":
        return "widget";
      case "named":
        return "named";
      default:
        return "";
    }
  }
);

export const selectGlobalMode = createSelector(
  [selectPlanAppState, selectAmbassadorMode],
  (state, ambassadorMode) => {
    switch (true) {
      case state.mode === "widget":
        return "widget";
      case state.sessionType === "client" &&
        state.mode === "main" &&
        state.keyId === "0000000000000000":
        return "clientExample";
      case state.sessionType === "client" && state.mode === "main":
        return "client";
      case ambassadorMode &&
        state.mode === "main" &&
        state.keyId === "0000000000000000":
        return "ambassadorExample";
      case ambassadorMode &&
        (state.mode === "main" || state.mode === "named"):
        return "ambassador";
      case ambassadorMode &&
        state.mode === "template" &&
        state.owner === 0:
        return "templateExample";
      case ambassadorMode && state.mode === "template":
        return "template";
      case state.mode === "named" && state.sessionType === "viewonly":
        return "namedViewonly";
      case state.sessionType === "viewonly":
        return "viewonly";
      default:
        return "";
    }
  }
);

export const selectIsSearchEnabled = createSelector(
  [selectPlanAppState],
  (state) => {
    return state.searchString !== "";
  }
);

export const selectIsAmbassadorOrClient = createSelector(
  [selectGlobalMode],
  (globalMode) => {
    return globalMode === "ambassador" || globalMode === "client" || globalMode === "widget";
  }
);

export const selectIsAmbassadorOrTemplate = createSelector(
  [selectGlobalMode],
  (globalMode) => {
    return globalMode === "ambassador" || 
           globalMode === "template" || 
           globalMode === "templateExample" ||
           globalMode === "widget";
  }
);

export const selectIsNamedMode = createSelector(
  [selectPlanAppState],
  (state) => state.mode === "named"
);

export const selectPlanType = createSelector(
  [selectPlanAppState],
  (state) => {
    return state.plan[0]?.toUpperCase() + state.plan.substring(1);
  }
);

// Direct state selectors
export const selectRoot = (state: { planApp: PlanAppState }) => state.planApp.root;
export const selectMode = (state: { planApp: PlanAppState }) => state.planApp.mode;
export const selectIsAppReady = (state: { planApp: PlanAppState }) => state.planApp.isAppReady;
export const selectTreeError = (state: { planApp: PlanAppState }) => state.planApp.treeError;
export const selectTreeErrorMsg = (state: { planApp: PlanAppState }) => state.planApp.treeErrorMsg;
export const selectTopRowRecalc = (state: { planApp: PlanAppState }) => state.planApp.topRowRecalc;
export const selectOpenedByNav = (state: { planApp: PlanAppState }) => state.planApp.openedByNav;
export const selectNavStepHovered = (state: { planApp: PlanAppState }) => state.planApp.navStepHovered;
export const selectWindowResizeFlag = (state: { planApp: PlanAppState }) => state.planApp.windowResizeFlag;
export const selectModalVisible = (state: { planApp: PlanAppState }) => state.planApp.modalVisible;
export const selectModalVideoSrc = (state: { planApp: PlanAppState }) => state.planApp.modalVideoSrc;
export const selectSearchString = (state: { planApp: PlanAppState }) => state.planApp.searchString;
export const selectSearchTrigger = (state: { planApp: PlanAppState }) => state.planApp.searchTrigger;
export const selectUseNav = (state: { planApp: PlanAppState }) => state.planApp.useNav;
export const selectShowTitles = (state: { planApp: PlanAppState }) => state.planApp.showTitles;
export const selectSessionType = (state: { planApp: PlanAppState }) => state.planApp.sessionType;
export const selectOwner = (state: { planApp: PlanAppState }) => state.planApp.owner;
export const selectKeyId = (state: { planApp: PlanAppState }) => state.planApp.keyId;
export const selectName = (state: { planApp: PlanAppState }) => state.planApp.name;
