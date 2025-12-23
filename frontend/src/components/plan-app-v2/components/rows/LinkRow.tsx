
import React from 'react';
import { PlanRow } from '../../types';
import RowHeader from './RowHeader';
import { LinkIcon } from '../Icons';

interface LinkRowProps {
  element: PlanRow;
  className?: string;
}

const LinkRow: React.FC<LinkRowProps> = ({ element, className = 'bg-white' }) => {
  // Changed p-2 to py-1.5 px-2 to reduce height by ~10%
  return (
    <div className={`${className} border border-gray-200 rounded-md py-1.5 px-2 shadow-sm w-full hover:shadow hover:border-gray-500 transition-all duration-200`}>
      <RowHeader 
        row={element} 
        icon={<LinkIcon className="text-blue-500" />}
      />
    </div>
  );
};

export default LinkRow;
