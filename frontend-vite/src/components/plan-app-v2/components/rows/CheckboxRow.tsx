
import React from 'react';
import { PlanRow } from '../../types';
import RowHeader from './RowHeader';
import { usePlan } from '../../context/PlanContext';
import { CheckMarkIcon, BoldCheckIcon, ClockIcon } from '../Icons';

interface CheckboxRowProps {
  element: PlanRow;
  className?: string;
}

const CheckboxRow: React.FC<CheckboxRowProps> = ({ element, className = 'bg-white' }) => {
  const { dispatch } = usePlan();

  const handleCheck = () => {
    if (element.checked === 4) {
        dispatch({ type: 'REQUEST_RESET_TASK', payload: { eid: element.eid, name: element.name } });
    } else {
        dispatch({ type: 'CYCLE_TASK_STATUS', payload: element.eid });
    }
  };

  const renderIcon = () => {
    const baseClass = "w-4 h-4 rounded border border-gray-400 flex items-center justify-center cursor-pointer transition-colors relative";
    
    // 0: Default - White, Empty
    if (element.checked === 0) {
        return (
            <div onClick={handleCheck} className={`${baseClass} bg-white hover:border-gray-500`} title="New">
                {/* Empty */}
            </div>
        );
    }
    
    // 1: Green Fill (#04cc08)
    if (element.checked === 1) {
         return (
            <div onClick={handleCheck} className={`${baseClass} border-[#04cc08]`} style={{ backgroundColor: '#04cc08' }} title="State 1">
            </div>
        );
    }

    // 2: Yellow Fill (#ffcc00)
    if (element.checked === 2) {
         return (
            <div onClick={handleCheck} className={`${baseClass} border-[#ffcc00]`} style={{ backgroundColor: '#ffcc00' }} title="State 2">
            </div>
        );
    }

    // 3: Red Fill
    if (element.checked === 3) {
         return (
            <div onClick={handleCheck} className={`${baseClass} bg-red-500 border-red-500`} title="State 3">
            </div>
        );
    }
    
    // 4: DONE - Green box, White Bold Checkmark (Navbar style)
    return (
        <div 
          onClick={handleCheck} 
          className={`${baseClass} border-[#04cc08] overflow-hidden`} 
          style={{ backgroundColor: '#04cc08' }}
          title="Done"
        >
            <BoldCheckIcon className="w-3 h-3 text-white drop-shadow-sm" />
        </div>
    );
  };

  const renderTimestamp = () => {
      // Show timestamp only on Done state (4)
      if (element.checked === 4 && element.date) {
          const date = new Date(parseInt(element.date) * 1000);
          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full border border-gray-200 select-none whitespace-nowrap">
                  <ClockIcon className="w-3 h-3 mr-1 text-gray-400" />
                  {dateStr}
              </span>
          );
      }
      return null;
  };

  // Uses the passed className (for alternating bg) or defaults to bg-white
  // Changed p-2 to py-1.5 px-2 to reduce height by ~10%
  return (
    <div className={`${className} border border-gray-200 rounded-md py-1.5 px-2 shadow-sm w-full hover:shadow hover:border-gray-500 transition-all duration-200`}>
      <RowHeader row={element} icon={renderIcon()}>
        {renderTimestamp()}
      </RowHeader>
    </div>
  );
};

export default CheckboxRow;
