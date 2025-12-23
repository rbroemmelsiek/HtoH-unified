import { PlanRow } from '../../../types/planApp/planRow';

export function findFamilyMemberPos(family: PlanRow[], eid: string): number {
  const index = family.findIndex((member) => member.eid === eid);
  return index !== -1 ? index : Infinity;
}

export function makeShortRow(row: PlanRow): PlanRow {
  return {
    owner: row.owner,
    eid: row.eid,
    pid: row.pid,
    pos: row.pos,
    name: row.name,
    tooltip: row.tooltip,
    type: row.type,
    checked: row.checked,
    visible: row.visible,
    new_window: row.new_window,
    link: row.link,
    date: row.date,
    video: row.video,
    video_script: row.video_script,
    children: [],
  };
}

export function findBranch(root: PlanRow, dst: PlanRow): false | PlanRow {
  for (const child of root.children) {
    if (child.eid === dst.eid) {
      return child;
    } else if (typeof child.children === "object" && child.children.length) {
      const found = findBranch(child, dst);
      if (found) {
        return found;
      }
    }
  }
  return false;
}
