import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/planApp/hooks';
import { selectRoot } from '../../store/planApp/planAppSelectors';
import { rowAdd } from '../../store/planApp/planAppThunks';
import getDummyElement from '../../utils/getDummyElement';

const NewPanelAdd: React.FC = () => {
  const dispatch = useAppDispatch();
  const root = useAppSelector(selectRoot);

  const handleAddPanel = () => {
    const newPanel = getDummyElement('panel', 'root');
    // Set position to end of children array
    newPanel.pos = root.children.length;
    dispatch(rowAdd({ 
      el: newPanel, 
      family: root.children, 
      parentEid: 'root',
      newPos: root.children.length,
      oldPos: 100 * 100,
    }));
  };

  return (
    <button 
      onClick={handleAddPanel} 
      className="new-panel-add"
      title="Add Panel"
      style={{
        width: '2.5rem',
        height: '2.5rem',
        padding: '0',
        backgroundColor: '#5972d0',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s, transform 0.1s',
        lineHeight: '1',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#4a5fb8';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#5972d0';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      +
    </button>
  );
};

export default NewPanelAdd;
