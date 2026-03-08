
import React, { useState } from 'react';
import { AddChildType, PlanRow } from '../types';
import { usePlan } from '../context/PlanContext';
import { getBulkSubtasks } from '../utils/aiHelpers';
import { 
  EyeIcon, EyeOffIcon, EditIcon, TrashIcon, 
  CheckSquareIcon, TypeIcon, LinkIcon, MessageSquareIcon, SettingsIcon, AtomIcon, LoaderIcon
} from './Icons';

interface ToolbarProps {
  element: PlanRow;
  visible: boolean;
  onToggleVisible: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdd: (type: AddChildType) => void;
  onSettings: () => void;
  orientation?: 'horizontal' | 'vertical';
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  element, visible, onToggleVisible, onEdit, onDelete, onAdd, onSettings, orientation = 'horizontal'
}) => {
  const { state, dispatch } = usePlan();
  const [isGenerating, setIsGenerating] = useState(false);
  const isVertical = orientation === 'vertical';

  const handleMagicBuild = async () => {
    setIsGenerating(true);
    const tasks = await getBulkSubtasks(element, state.plan);
    if (tasks.length > 0) {
      dispatch({ 
        type: 'ADD_MULTIPLE_CHILDREN', 
        payload: { parentEid: element.eid, children: tasks as any } 
      });
    }
    setIsGenerating(false);
  };

  const containerClass = isVertical 
    ? "flex flex-col gap-2 bg-white border border-gray-200 shadow-xl rounded-lg p-2 z-50" 
    : "flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md rounded-full px-3 py-1";
  
  const groupClass = isVertical 
    ? "flex flex-col gap-1 border-b border-gray-200 pb-2 mb-1" 
    : "flex gap-1 border-r border-gray-300 pr-2 mr-2";
    
  const buttonClass = "p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors flex items-center justify-center relative";

  return (
    <div className={containerClass}>
      <div className={groupClass}>
        <button onClick={onToggleVisible} className={buttonClass} title="Toggle Visibility">{visible ? <EyeIcon /> : <EyeOffIcon />}</button>
        <button onClick={onEdit} className={buttonClass} title="Edit"><EditIcon /></button>
        <button onClick={onDelete} className={`${buttonClass} hover:text-red-600`} title="Delete"><TrashIcon /></button>
        <button onClick={onSettings} className={`${buttonClass} hover:text-blue-600`} title="Settings"><SettingsIcon /></button>
      </div>

      <div className={isVertical ? "flex flex-col gap-1" : "flex gap-1"}>
        {state.aiMode && (
          <button 
            onClick={handleMagicBuild} 
            className={`${buttonClass} hover:text-[#ff6600] focus:text-[#ff6600] ${isGenerating ? 'text-[#ff6600]' : ''}`} 
            title="Auto-build subtasks"
            disabled={isGenerating}
          >
            {isGenerating ? <LoaderIcon className="w-4 h-4" /> : <AtomIcon className="w-4 h-4" />}
          </button>
        )}
        <button onClick={() => onAdd('checkbox')} className={buttonClass} title="Add Task"><CheckSquareIcon /></button>
        <button onClick={() => onAdd('text')} className={buttonClass} title="Add Title"><TypeIcon /></button>
        <button onClick={() => onAdd('link')} className={buttonClass} title="Add Link"><LinkIcon /></button>
        <button onClick={() => onAdd('comment')} className={buttonClass} title="Add message"><MessageSquareIcon /></button>
      </div>
    </div>
  );
};

export default Toolbar;
