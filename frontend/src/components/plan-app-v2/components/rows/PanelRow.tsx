
import React, { useRef } from 'react';
import { PlanRow } from '../../types';
import RowHeader from './RowHeader';
import { CaretDownFillIcon, CaretRightFillIcon } from '../Icons';
import { usePlan } from '../../context/PlanContext';

interface PanelRowProps {
  element: PlanRow;
}

const PanelRow: React.FC<PanelRowProps> = ({ element }) => {
  const { state, dispatch } = usePlan();
  const rootRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_OPEN', payload: element.eid });
  };

  const handleMouseEnter = () => {
    dispatch({ type: 'SET_HOVERED_ROW', payload: element.eid });
  };

  const handleMouseLeave = () => {
    dispatch({ type: 'SET_HOVERED_ROW', payload: null });
  };

  const isHovered = state.hoveredRowId === element.eid;
  
  // Base color: #141D84, Hover: #1a25a0 - use inline style to guarantee dark blue shows
  const bgColor = isHovered ? '#1a25a0' : '#141D84';

  // Adjusted scroll-mt to 65px to align with navbar height and provide a clean gap
  // Removed select-none to allow text selection in inputs
  return (
    <div 
      id={element.eid} 
      ref={rootRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ backgroundColor: bgColor }}
      className="text-white py-1.5 px-2 rounded-md shadow-sm w-full scroll-mt-[65px] transition-colors duration-200"
    >
      <RowHeader 
        row={element} 
        isPanel={true}
        icon={
          element.children.length > 0 ? (
            <div 
              onClick={handleToggle} 
              className="cursor-pointer hover:bg-white/20 rounded p-0.5"
            >
              {element.opened ? <CaretDownFillIcon className="w-3.5 h-3.5" /> : <CaretRightFillIcon className="w-3.5 h-3.5" />}
            </div>
          ) : null
        }
      />
    </div>
  );
};

export default PanelRow;
