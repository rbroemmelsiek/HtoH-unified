import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/planApp/hooks';
import { setSearchString, triggerSearch } from '../../store/planApp/planAppSlice';
import { selectSearchString } from '../../store/planApp/planAppSelectors';
import { highlightMatchingElementsRecursive, clearSearchHighlightsRecursive } from '../../store/planApp/planAppThunks';

const SearchBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchString = useAppSelector(selectSearchString);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchString(value));
    
    if (value) {
      dispatch(highlightMatchingElementsRecursive({}));
    } else {
      dispatch(clearSearchHighlightsRecursive({}));
    }
    
    dispatch(triggerSearch());
  };

  return (
    <div className="plan-app__search" style={{ 
      position: 'relative',
      display: 'inline-block',
    }}>
      <input
        type="text"
        placeholder="Search Plan"
        value={searchString}
        onChange={handleSearchChange}
        className="search-input"
        style={{
          padding: '0.5rem 2.5rem 0.5rem 1rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '0.9rem',
          width: '250px',
          outline: 'none',
        }}
      />
      <i 
        className="fas fa-search" 
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#666',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default SearchBar;
