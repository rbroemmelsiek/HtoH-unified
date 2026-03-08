import { PlanRow } from './planRow';

export interface PlanAppState {
  // global options from plan-app-options html element
  mode: string; // old name page
  owner: number;
  plan: string; // old name planType
  sessionType: string;
  useNav: boolean;
  showTitles: boolean;
  editVideo: boolean;
  fakePanelsNumber: number;
  useCached: boolean;

  // come from database
  keyId: string;
  name: string;
  root: {
    children: PlanRow[];
  };

  // state of the plan
  isAppReady: boolean;
  loaded: number; // timestamp plan was loaded

  // used to enlarge and shrink the plan app
  // in case it has height less than required to display warning messages
  topRowRecalc: {
    top: number;
    left: number;
    offsetHeight: number;
    offsetTop: number;
    offsetWidth: number;
  } | null;

  // error handling
  treeError: boolean;
  treeErrorMsg: string;

  // nav bar related
  openedByNav: string;
  navStepHovered: string;

  // save related
  saveCounter: number;

  // window resize related
  windowResizeFlag: number;

  // modal video related
  modalVisible: boolean;
  modalVideoSrc: string;

  // search related
  searchString: string;
  searchTrigger: string;
  unsubscribe: (() => void) | null;
}

export const initialState: PlanAppState = {
  // global options from plan-app-options html element
  mode: "",
  owner: Infinity,
  plan: "",
  sessionType: "",
  useNav: true,
  showTitles: true,
  editVideo: false,
  fakePanelsNumber: 8,
  useCached: false,

  // come from database
  keyId: "",
  name: "",
  root: {
    children: [],
  },

  // state of the plan
  isAppReady: false,
  loaded: 0,

  // used to enlarge and shrink the plan app
  topRowRecalc: null,

  // error handling
  treeError: false,
  treeErrorMsg: "",

  // nav bar related
  openedByNav: "",
  navStepHovered: "",

  // save related
  saveCounter: 0,

  // window resize related
  windowResizeFlag: 0,

  // modal video related
  modalVisible: false,
  modalVideoSrc: "",

  // search related
  searchString: "",
  searchTrigger: "",
  unsubscribe: null,
};
