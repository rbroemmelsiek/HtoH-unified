import React, { useState, useCallback } from 'react';
import { PlanRow } from '../../../types/planApp/planRow';
import AddCheckboxButton from './buttons/AddCheckboxButton';
import AddLinkButton from './buttons/AddLinkButton';
import AddTextButton from './buttons/AddTextButton';
import AddCommentButton from './buttons/AddCommentButton';
import { useAppSelector } from '../../../store/planApp/hooks';
import { selectGlobalMode, selectMode } from '../../../store/planApp/planAppSelectors';

interface AddButtonsBlockProps {
  element: PlanRow;
  onAddNewEl: (type: string) => void;
}

const AddButtonsBlock: React.FC<AddButtonsBlockProps> = ({
  element,
  onAddNewEl,
}) => {
  const globalMode = useAppSelector(selectGlobalMode);
  const mode = useAppSelector(selectMode);
  const [visibleButtons, setVisibleButtons] = useState<Set<string>>(new Set());

  // Memoize the callback to avoid recreating it each render and causing effect loops
  const handleButtonExist = useCallback((buttonId: string) => {
    setVisibleButtons((prev) => {
      // If this button is already registered, avoid creating a new Set instance
      if (prev.has(buttonId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(buttonId);
      return next;
    });
  }, []);

  // In widget mode, always show (buttons will handle their own visibility)
  const isWidget = globalMode === 'widget' || mode === 'widget';
  const shouldShow = isWidget || visibleButtons.size > 0;

  if (!shouldShow) {
    return null;
  }

  return (
    <span className="addEl icons__block deny-toggle">
      <AddCheckboxButton
        element={element}
        onAddNewEl={onAddNewEl}
        onExist={() => handleButtonExist('checkbox')}
      />
      <AddLinkButton
        element={element}
        onAddNewEl={onAddNewEl}
        onExist={() => handleButtonExist('link')}
      />
      <AddTextButton
        element={element}
        onAddNewEl={onAddNewEl}
        onExist={() => handleButtonExist('text')}
      />
      <AddCommentButton
        element={element}
        onAddNewEl={onAddNewEl}
        onExist={() => handleButtonExist('comment')}
      />
    </span>
  );
};

export default AddButtonsBlock;
