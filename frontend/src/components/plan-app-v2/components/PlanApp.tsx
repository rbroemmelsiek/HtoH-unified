
import React from 'react';
import { usePlan } from '../context/PlanContext';
import SearchBar from './SearchBar';
import EntryComponent from './EntryComponent';
import { PlusIcon, AtomIcon } from './Icons';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ConfirmResetModal from './ConfirmResetModal';
import VideoModal from './VideoModal';
import SettingsModal from './SettingsModal';
import ProgressNav from './ProgressNav';

const PlanApp: React.FC = () => {
  const { state, dispatch } = usePlan();

  const handleAddPanel = () => {
    dispatch({ type: 'ADD_CHILD', payload: { parentEid: 'root', type: 'panel' } });
  };

  const toggleAiMode = () => {
    dispatch({ type: 'TOGGLE_AI_MODE' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-40">
      <ConfirmDeleteModal />
      <ConfirmResetModal />
      <VideoModal />
      <SettingsModal />
      
      {/* Sticky Progress Nav */}
      <ProgressNav />
      
      {/* Main Container: max-w-[100vw] overflow-x-hidden for mobile constraints */}
      <div className="w-full max-w-4xl px-0 md:px-4 flex flex-col items-center gap-[10px] md:gap-4 mt-[10px] md:mt-6 overflow-x-hidden">
        {/* Header Area: Padding adjusted to 10px spacing rule on mobile */}
        <div className="w-full mb-0 md:mb-4 flex flex-col items-center gap-[10px] md:gap-4 px-4 md:px-0">
          <h1 className="text-[1.2em] font-normal font-serif text-gray-800 tracking-tight">{state.plan.name}</h1>
          
          <div className="w-full flex justify-between items-center gap-2 md:gap-4">
            <SearchBar />
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={toggleAiMode}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all transform hover:scale-105 ${
                  state.aiMode 
                    ? 'bg-[#141D84] text-[#ff6600] ring-2 ring-[#ff6600]/30' 
                    : 'bg-white text-gray-400 border border-gray-200 hover:text-[#ff6600]'
                }`}
                title={state.aiMode ? "Disable AI Edit Mode" : "Enable AI Edit Mode"}
              >
                <AtomIcon className="w-5 h-5" />
              </button>

              <button
                onClick={handleAddPanel}
                className="w-10 h-10 bg-[#141D84] hover:bg-blue-800 text-white rounded-full flex items-center justify-center shadow-md transition-transform transform hover:scale-105"
                title="Add New Panel"
              >
                <PlusIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Plan Content */}
        <div className="w-full bg-white/50 md:rounded-xl p-0 md:p-1">
          <ul className="flex flex-col gap-[2px]">
            {state.plan.root.children.map((panel) => (
              <EntryComponent key={panel.eid} branch={panel} />
            ))}
          </ul>

          {state.plan.root.children.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              No panels yet. Click the + button to add one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanApp;
