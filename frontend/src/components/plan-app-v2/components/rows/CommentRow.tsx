
import React from 'react';
import { PlanRow } from '../../types';
import RowHeader from './RowHeader';
import { MessageSquareIcon } from '../Icons';

interface CommentRowProps {
  element: PlanRow;
}

const CommentRow: React.FC<CommentRowProps> = ({ element }) => {
  // Changed p-2 to py-1.5 px-2 to reduce height by ~10%
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md py-1.5 px-2 shadow-sm w-full hover:shadow hover:border-gray-500 transition-all duration-200">
      <RowHeader 
        row={element} 
        icon={<MessageSquareIcon className="text-yellow-600" />}
      />
    </div>
  );
};

export default CommentRow;
