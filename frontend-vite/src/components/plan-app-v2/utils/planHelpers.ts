
import { PlanRow, PlanRowType, PlanDocument } from '../types';

export const generateId = (prefix: string = 'el'): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

export const getDummyElement = (type: PlanRowType, pid: string, pos: number): PlanRow => {
  let defaultName = `New ${type}`;
  if (type === 'panel') {
    defaultName = 'New Panel';
  } else if (type === 'checkbox') {
    // Specifically requested "New  task" (double space)
    defaultName = 'New  task';
  } else if (type === 'text') {
    // Specifically requested "New title" for text rows
    defaultName = 'New title';
  } else if (type === 'comment') {
    // Specifically requested "Add message" for comment rows
    defaultName = 'Add message';
  }

  return {
    eid: generateId(type),
    pid,
    pos,
    type,
    name: defaultName,
    tooltip: '',
    link: '',
    date: null,
    new_window: true,
    visible: true,
    opened: true, // Default open for UX
    edit: true, // Auto-enter edit mode
    checked: 0,
    video: '',
    video_script: '',
    owner: 0,
    children: [],
    isNew: true
  };
};

// Deep clone helper
export const clonePlan = (plan: PlanDocument): PlanDocument => {
  return JSON.parse(JSON.stringify(plan));
};

// Find a row by ID in a list of siblings (recursive)
export const findRowInTree = (nodes: PlanRow[], eid: string): PlanRow | null => {
  for (const node of nodes) {
    if (node.eid === eid) return node;
    const found = findRowInTree(node.children, eid);
    if (found) return found;
  }
  return null;
};

// Find the path (array of EIDs) from root (excluding root itself if strictly children) to the target node
// Returns null if not found
export const findPathToNode = (nodes: PlanRow[], targetEid: string, currentPath: string[] = []): string[] | null => {
  for (const node of nodes) {
    if (node.eid === targetEid) {
      return [...currentPath, node.eid];
    }
    const childPath = findPathToNode(node.children, targetEid, [...currentPath, node.eid]);
    if (childPath) return childPath;
  }
  return null;
};

// Find the family (array of siblings) containing the eid
export const findFamily = (root: { children: PlanRow[] }, parentEid: string): PlanRow[] | null => {
  if (parentEid === 'root') return root.children;
  
  const parent = findRowInTree(root.children, parentEid);
  return parent ? parent.children : null;
};

// Find the parent object of a given child EID
export const findParent = (node: { children: PlanRow[] }, childEid: string): { children: PlanRow[] } | null => {
  if (node.children.some(c => c.eid === childEid)) {
    return node;
  }
  for (const child of node.children) {
    const found = findParent(child, childEid);
    if (found) return found;
  }
  return null;
};

// Check if a row or its descendants match a search term
export const rowMatchesSearch = (row: PlanRow, term: string): boolean => {
  if (!term) return true;
  const lowerTerm = term.toLowerCase();
  
  // Check self
  if (row.name.toLowerCase().includes(lowerTerm)) return true;
  if (row.link.toLowerCase().includes(lowerTerm)) return true;
  if (row.tooltip.toLowerCase().includes(lowerTerm)) return true;
  
  // Check children
  return row.children.some(child => rowMatchesSearch(child, term));
};

// Check if a row has any descendant of type 'checkbox'
export const hasTaskDescendant = (row: PlanRow): boolean => {
  if (row.type === 'checkbox') return true;
  return row.children.some(child => hasTaskDescendant(child));
};

// Delete a row by ID from the tree (in-place modification of the array tree)
export const deleteRowFromTree = (list: PlanRow[], eid: string): boolean => {
  const idx = list.findIndex(r => r.eid === eid);
  if (idx !== -1) {
    list.splice(idx, 1);
    return true;
  }
  for (const child of list) {
    if (deleteRowFromTree(child.children, eid)) return true;
  }
  return false;
};

// Get flattened list of visible rows based on search state and opened status
export const getVisibleFlatList = (nodes: PlanRow[], searchTerm: string, isSearchEnabled: boolean): PlanRow[] => {
  let result: PlanRow[] = [];
  for (const node of nodes) {
    // If search is enabled, check if this node matches or has matching descendants
    if (isSearchEnabled && !rowMatchesSearch(node, searchTerm)) {
      continue;
    }

    result.push(node);

    // If search is enabled, we assume everything is expanded
    // If search is disabled, we check node.opened
    if (isSearchEnabled || node.opened) {
      result.push(...getVisibleFlatList(node.children, searchTerm, isSearchEnabled));
    }
  }
  return result;
};
