import React, { useRef, useState } from 'react';
import { PlanRow } from '../types';
import { usePlan } from '../context/PlanContext';
import { rowMatchesSearch } from '../utils/planHelpers';

import PanelRow from './rows/PanelRow';
import CheckboxRow from './rows/CheckboxRow';
import TextRow from './rows/TextRow';
import LinkRow from './rows/LinkRow';
import CommentRow from './rows/CommentRow';

interface EntryComponentProps {
  branch: PlanRow;
  depth?: number;
  index?: number;
}

const EntryComponent: React.FC<EntryComponentProps> = ({ branch, depth = 0, index = 0 }) => {
  const { state, dispatch } = usePlan();
  const [isDragOver, setIsDragOver] = useState<'top' | 'bottom' | null>(null);
  const ref = useRef<HTMLLIElement>(null);

  // Search Filtering
  if (state.isSearchEnabled) {
    if (!rowMatchesSearch(branch, state.searchTerm)) {
      return null;
    }
  }

  // Calculate background color based on DEPTH (hierarchy level), not sibling index.
  // Depth 0 (Panels) are always handled by PanelRow's own bg.
  // Depth 1 (children of Panel): White.
  // Depth 2 (children of Depth 1): Gray-50.
  // Logic: Odd depth = White, Even depth = Gray-50.
  const bgClass = (depth % 2 !== 0) ? "bg-white" : "bg-gray-50";

  // Component Selection
  let RowComponent;
  let props: any = { element: branch };

  switch (branch.type) {
    case 'panel': 
      RowComponent = PanelRow; 
      break;
    case 'checkbox': 
      RowComponent = CheckboxRow; 
      props.className = bgClass;
      break;
    case 'text': 
      RowComponent = TextRow; 
      props.className = bgClass;
      break;
    case 'link': 
      RowComponent = LinkRow; 
      props.className = bgClass;
      break;
    case 'comment': 
      RowComponent = CommentRow; 
      // CommentRow handles its own yellow background
      break;
    default: 
      RowComponent = TextRow;
      props.className = bgClass;
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      return;
    }
    
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', branch.eid);
    e.dataTransfer.effectAllowed = 'move';
    
    dispatch({ type: 'SET_DRAGGED_ROW', payload: branch.eid });
    
    if (ref.current) ref.current.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    if (ref.current) ref.current.style.opacity = '1';
    setIsDragOver(null);
    dispatch({ type: 'SET_DRAGGED_ROW', payload: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const isTop = e.clientY < midpoint;
    
    setIsDragOver(isTop ? 'top' : 'bottom');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(null);
    
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const isTop = e.clientY < midpoint;

    const srcEid = e.dataTransfer.getData('text/plain');
    if (srcEid && srcEid !== branch.eid) {
      // 1. Perform Move
      dispatch({
        type: 'MOVE_ROW',
        payload: {
          srcEid,
          destEid: branch.eid,
          position: isTop ? 'before' : 'after'
        }
      });

      // 2. Trigger Highlight for dropped item
      dispatch({ type: 'SET_DROPPED_ROW', payload: srcEid });
      
      // 3. Clear highlight after delay (Reduced from 500ms to 300ms)
      setTimeout(() => {
          dispatch({ type: 'SET_DROPPED_ROW', payload: null });
      }, 300);
    }
  };

  // Styles
  const hiddenClass = !branch.visible ? "opacity-40 grayscale" : "";
  
  // Adjusted Padding Logic:
  // Depth 0 (Panel): 0
  // Depth 1 (Child of Panel): 0 (Flush alignment requested)
  // Depth > 1: Indent (ml-1.5)
  const nestedPadding = depth > 1 ? "ml-1.5" : "";
  
  // Highlight Logic
  const isHighlighted = state.draggedRowId === branch.eid || 
                        state.highlightedAncestors.includes(branch.eid) || 
                        state.droppedRowId === branch.eid;

  let dragStyle = "";
  if (isDragOver === 'top') dragStyle = "border-t-2 border-blue-500";
  if (isDragOver === 'bottom') dragStyle = "border-b-2 border-blue-500";

  // If highlighted, add a background ring or color.
  let highlightClass = "";
  if (isHighlighted) {
      if (state.draggedRowId === branch.eid || state.droppedRowId === branch.eid) {
          highlightClass = "ring-2 ring-yellow-400 bg-yellow-50 rounded";
      } else {
          highlightClass = "ring-1 ring-yellow-200 bg-yellow-50/50 rounded";
      }
  }

  // Animation Logic
  const hasChildren = branch.children && branch.children.length > 0;
  const isOpen = branch.opened || state.isSearchEnabled;
  const isPanel = branch.type === 'panel';

  // Container Class Logic:
  // If Panel: No padding/border for children (Flush)
  // If Not Panel (Nested Tasks): Add padding/border for hierarchy
  const childContainerClass = isPanel 
    ? "w-full mt-0.5 pl-0" 
    : "w-full mt-0.5 border-l-2 border-gray-100 pl-2";

  return (
    <li 
      ref={ref}
      className={`flex flex-col mb-0 ${hiddenClass} ${nestedPadding} ${dragStyle} ${highlightClass} transition-all duration-75`}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* The Row Itself */}
      <RowComponent {...props} />

      {/* Recursive Children with CSS Grid Animation - using ease-out for inertia */}
      {hasChildren && (
        <div 
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <ul className={childContainerClass}>
              {branch.children.map((child, idx) => (
                <EntryComponent key={child.eid} branch={child} depth={depth + 1} index={idx} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
};

export default EntryComponent;