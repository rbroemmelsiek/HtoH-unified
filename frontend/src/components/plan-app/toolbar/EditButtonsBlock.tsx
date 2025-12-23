import React, { useState, useCallback } from 'react';
import { PlanRow } from '../../../types/planApp/planRow';
import VisibilityButton from './buttons/VisibilityButton';
import EditButton from './buttons/EditButton';
import DeleteButton from './buttons/DeleteButton';
import { useAppSelector } from '../../../store/planApp/hooks';
import { selectGlobalMode, selectMode } from '../../../store/planApp/planAppSelectors';

interface EditButtonsBlockProps {
  element: PlanRow;
  onDeleteEl: () => void;
  onHide?: () => void;
}

const EditButtonsBlock: React.FC<EditButtonsBlockProps> = ({
  element,
  onDeleteEl,
  onHide,
}) => {
  const globalMode = useAppSelector(selectGlobalMode);
  const mode = useAppSelector(selectMode);
  const [visibleButtons, setVisibleButtons] = useState<Set<string>>(new Set());

  // Memoize the callback to prevent infinite loops
  const handleButtonExist = useCallback((buttonId: string) => {
    setVisibleButtons((prev) => {
      // Only update if buttonId is not already in the set
      if (prev.has(buttonId)) {
        return prev; // Return same reference if no change
      }
      const next = new Set(prev);
      next.add(buttonId);
      return next;
    });
  }, []); // Empty deps - function never changes

  // In widget mode, always show (buttons will handle their own visibility)
  const isWidget = globalMode === 'widget' || mode === 'widget';
  const shouldShow = isWidget || visibleButtons.size > 0;

  if (!shouldShow) {
    return null;
  }

  return (
    <span className="editEl icons__block deny-toggle">
      <VisibilityButton
        element={element}
        onHide={onHide}
        onExist={() => handleButtonExist('visibility')}
      />
      <EditButton
        element={element}
        onHide={onHide}
        onExist={() => handleButtonExist('edit')}
      />
      <DeleteButton
        element={element}
        onDeleteEl={onDeleteEl}
        onExist={() => handleButtonExist('delete')}
      />
    </span>
  );
};

export default EditButtonsBlock;
