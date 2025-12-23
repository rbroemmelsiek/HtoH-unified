import React, { useEffect } from 'react';
import { PlanRow } from '../../../../types/planApp/planRow';
import { useAppSelector, useAppDispatch } from '../../../../store/planApp/hooks';
import {
  selectIsAmbassadorOrTemplate,
  selectIsNamedMode,
  selectGlobalMode,
  selectMode,
} from '../../../../store/planApp/planAppSelectors';
import { rowUpdate } from '../../../../store/planApp/planAppThunks';
import { useEditingPermissions } from '../../../../hooks/useEditingPermissions';

interface VisibilityButtonProps {
  element: PlanRow;
  onHide?: () => void;
  onExist?: () => void;
}

const VisibilityButton: React.FC<VisibilityButtonProps> = ({
  element,
  onHide,
  onExist,
}) => {
  const dispatch = useAppDispatch();
  const isAmbassadorOrTemplate = useAppSelector(selectIsAmbassadorOrTemplate);
  const isNamedMode = useAppSelector(selectIsNamedMode);
  const globalMode = useAppSelector(selectGlobalMode);
  const mode = useAppSelector(selectMode);
  const permissions = useEditingPermissions(element);

  const elementExist = (() => {
    const isWidget = globalMode === 'widget' || mode === 'widget';
    if (isWidget) {
      // In widget mode, always show for non-comment/link elements
      return !permissions.shouldTreatAsComment;
    }
    if (isNamedMode && isAmbassadorOrTemplate) {
      return true;
    }
    if (permissions.shouldTreatAsComment) {
      return false;
    }
    return isAmbassadorOrTemplate;
  })();

  // In widget mode, always render (button handles its own visibility)
  const shouldRender = elementExist || globalMode === 'widget' || mode === 'widget';

  const isDisabled =
    permissions.hasEnabledWhatsNextCount ||
    permissions.taskLockedForEditing ||
    permissions.hasComments ||
    permissions.hasFinishedTasks;

  useEffect(() => {
    if (shouldRender && onExist) {
      onExist();
    }
  }, [shouldRender]); // Remove onExist from deps - it's now stable via useCallback

  if (!shouldRender) {
    return null;
  }

  const toggleVisible = () => {
    if (isDisabled) {
      return;
    }

    if (onHide) {
      onHide();
    }

    dispatch(
      rowUpdate({
        el: element,
        update: [['visible', !element.visible]],
      })
    );
  };

  const iconClass = element.visible ? 'fa-eye' : 'fa-eye-slash';
  const iconTitle = element.visible
    ? 'Visible to client'
    : 'Not visible to client';

  return (
    <i
      className={`fas fa-fw fa-fw--thin icon-item ${iconClass} ${isDisabled ? 'disabled' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleVisible();
      }}
      title={iconTitle}
    />
  );
};

export default VisibilityButton;
