import React, { useEffect } from 'react';
import { PlanRow } from '../../../../types/planApp/planRow';
import { useAppSelector, useAppDispatch } from '../../../../store/planApp/hooks';
import {
  selectIsAmbassadorOrClient,
  selectIsAmbassadorOrTemplate,
  selectAmbassadorMode,
  selectGlobalMode,
  selectIsNamedMode,
  selectMode,
} from '../../../../store/planApp/planAppSelectors';
import { updateElementLocal } from '../../../../store/planApp/planAppSlice';
import { useEditingPermissions } from '../../../../hooks/useEditingPermissions';

interface EditButtonProps {
  element: PlanRow;
  onHide?: () => void;
  onExist?: () => void;
}

const EditButton: React.FC<EditButtonProps> = ({
  element,
  onHide,
  onExist,
}) => {
  const dispatch = useAppDispatch();
  const isAmbassadorOrClient = useAppSelector(selectIsAmbassadorOrClient);
  const isAmbassadorOrTemplate = useAppSelector(selectIsAmbassadorOrTemplate);
  const ambassadorMode = useAppSelector(selectAmbassadorMode);
  const globalMode = useAppSelector(selectGlobalMode);
  const isNamedMode = useAppSelector(selectIsNamedMode);
  const mode = useAppSelector(selectMode);
  const permissions = useEditingPermissions(element);

  const elementExist = (() => {
    const isWidget = globalMode === 'widget' || mode === 'widget';
    if (isWidget) {
      return !permissions.shouldTreatAsComment;
    }
    return (
      (isAmbassadorOrClient && permissions.isMyCommentOrLink) ||
      (ambassadorMode && !permissions.shouldTreatAsComment) ||
      globalMode === 'template' ||
      (isNamedMode && isAmbassadorOrTemplate)
    );
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

  const editEl = () => {
    if (permissions.taskLockedForEditing) {
      return;
    }

    if (onHide) {
      onHide();
    }

    dispatch(
      updateElementLocal({
        el: element,
        update: [['edit', true]],
      })
    );
  };

  return (
    <i
      className={`fas fa-fw fa-fw--thin fa-pen-to-square icon-item ${permissions.taskLockedForEditing ? 'disabled' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        editEl();
      }}
      title="Edit"
    />
  );
};

export default EditButton;
