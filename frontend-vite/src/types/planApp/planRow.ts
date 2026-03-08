export interface PlanRow {
  // fields come from the database
  checked: number;
  children: PlanRow[];
  date: string | null;
  eid: string;
  link: string;
  name: string;
  new_window: boolean;
  owner: number;
  pid: string;
  pos: number;
  tooltip: string;
  type: "panel" | "text" | "checkbox" | "link" | "comment" | "root";
  video: string;
  video_script: string;
  visible: boolean;
  html?: string;

  // row local state fields
  opened?: boolean;
  edit?: boolean; // edit name
  videoEdit?: boolean;

  // row search result fields
  highlightedName?: boolean;
  highlightedVideo?: boolean;
  highlightedTooltip?: boolean;

  // counters
  commentsCount?: number;
  unreadCommentsCount?: number;

  enabledWhatsNextCount?: number;
  doneTasks?: number;
  totalTasks?: number;

  /** local counters used for display information on the element
   * but not to be propagated to the navbar
   **/
  localEnabledWhatsNextCount?: number;
  localDoneTasks?: number;
  localTotalTasks?: number;

  // search related
  filterMatch?: boolean;
}
