import { PlanRow } from './planRow';

export interface NavStepType {
  pid: string;
  name: string;
  n: number;
  panel: PlanRow;
  doneCount: number;
  donePercent: number;
  wnCount: number;
  wnPercent: number;
  totalCount: number;
  navOpened: boolean;
  hovered: boolean;
  visible: boolean;
}
