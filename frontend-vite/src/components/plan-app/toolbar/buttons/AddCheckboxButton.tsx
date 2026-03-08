import React, { useEffect } from 'react';
import { PlanRow } from '../../../../types/planApp/planRow';
import { useAppSelector } from '../../../../store/planApp/hooks';
import {
  selectIsAmbassadorOrTemplate,
  selectGlobalMode,
  selectMode,
} from '../../../../store/planApp/planAppSelectors';
import { useEditingPermissions } from '../../../../hooks/useEditingPermissions';

interface AddCheckboxButtonProps {
  element: PlanRow;
  onAddNewEl: (type: string) => void;
  onExist?: () => void;
}

const AddCheckboxButton: React.FC<AddCheckboxButtonProps> = ({
  element,
  onAddNewEl,
  onExist,
}) => {
  const isAmbassadorOrTemplate = useAppSelector(selectIsAmbassadorOrTemplate);
  const globalMode = useAppSelector(selectGlobalMode);
  const mode = useAppSelector(selectMode);
  const permissions = useEditingPermissions(element);

  const elementExist = (() => {
    const isWidget = globalMode === 'widget' || mode === 'widget';
    if (isWidget) {
      return !permissions.shouldTreatAsComment;
    }
    return isAmbassadorOrTemplate && !permissions.shouldTreatAsComment;
  })();

  // In widget mode, always render
  const shouldRender = elementExist || globalMode === 'widget' || mode === 'widget';

  useEffect(() => {
    if (shouldRender && onExist) {
      onExist();
    }
  }, [shouldRender]); // Remove onExist from deps - it's now stable via useCallback

  if (!shouldRender) {
    return null;
  }

  return (
    <i
      className="fas fa-fw fa-fw--thin fa-square-check icon-item"
      onClick={(e) => {
        e.stopPropagation();
        onAddNewEl('checkbox');
      }}
      title="Add checkbox"
    />
  );
};

export default AddCheckboxButton;
