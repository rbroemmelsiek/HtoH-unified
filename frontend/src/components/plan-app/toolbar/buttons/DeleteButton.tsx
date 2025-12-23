import React, { useEffect } from 'react';
import { PlanRow } from '../../../../types/planApp/planRow';
import { useAppSelector } from '../../../../store/planApp/hooks';
import {
  selectIsAmbassadorOrClient,
  selectIsAmbassadorOrTemplate,
  selectAmbassadorMode,
  selectGlobalMode,
  selectIsNamedMode,
  selectMode,
} from '../../../../store/planApp/planAppSelectors';
import { useEditingPermissions } from '../../../../hooks/useEditingPermissions';

interface DeleteButtonProps {
  element: PlanRow;
  onDeleteEl: () => void;
  onExist?: () => void;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  element,
  onDeleteEl,
  onExist,
}) => {
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
      (isAmbassadorOrTemplate && !permissions.shouldTreatAsComment) ||
      globalMode === 'template' ||
      (isNamedMode && isAmbassadorOrTemplate)
    );
  })();

  // In widget mode, always render
  const shouldRender = elementExist || globalMode === 'widget' || mode === 'widget';

  const deleteButtonDisabled =
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

  const emitDelElExt = () => {
    if (deleteButtonDisabled) {
      return;
    }
    onDeleteEl();
  };

  return (
    <i
      className={`fas fa-fw fa-fw--thin fa-trash icon-item ${deleteButtonDisabled ? 'disabled' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        emitDelElExt();
      }}
      title="Delete"
    />
  );
};

export default DeleteButton;
