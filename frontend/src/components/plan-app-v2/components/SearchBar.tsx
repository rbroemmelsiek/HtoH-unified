
import React from 'react';
import { usePlan } from '../context/PlanContext';
import { SearchIcon, XIcon } from './Icons';

const SearchBar: React.FC = () => {
  const { state, dispatch } = usePlan();
  const hasTerm = state.searchTerm.length > 0;

  const handleClear = () => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: '' });
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10 text-gray-400">
        {hasTerm ? (
          <button 
            onClick={handleClear} 
            className="focus:outline-none text-[#141D84] hover:text-blue-900 transition-colors p-1 cursor-pointer"
            title="Clear search"
          >
            <XIcon size={24} strokeWidth={3} />
          </button>
        ) : (
          <div className="pointer-events-none">
             <SearchIcon />
          </div>
        )}
      </div>
      <input
        type="text"
        className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
        placeholder="Search Plan"
        value={state.searchTerm}
        onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
      />
    </div>
  );
};

export default SearchBar;
