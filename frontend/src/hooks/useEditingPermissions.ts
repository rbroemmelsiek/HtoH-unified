import { useMemo } from 'react';
import { PlanRow } from '../types/planApp/planRow';
import { useAppSelector } from '../store/planApp/hooks';
import { selectOwner } from '../store/planApp/planAppSelectors';

export function useEditingPermissions(element: PlanRow) {
  const owner = useAppSelector(selectOwner);

  return useMemo(() => {
    const hasEnabledWhatsNextCount = element.enabledWhatsNextCount
      ? element.enabledWhatsNextCount > 0
      : false;

    const hasComments = element.unreadCommentsCount
      ? element.unreadCommentsCount > 0
      : false;

    const hasFinishedTasks = element.doneTasks ? element.doneTasks > 0 : false;

    const taskDone = element.type === 'checkbox' && element.checked === 1;
    const taskWhatsNextSet = element.type === 'checkbox' && element.checked === 2;
    const taskLockedForEditing = taskDone || taskWhatsNextSet;

    const shouldTreatAsComment =
      element.type === 'comment' || element.type === 'link';

    const myElement = element.owner === owner;
    const isMyCommentOrLink = shouldTreatAsComment && myElement;

    return {
      hasEnabledWhatsNextCount,
      hasComments,
      hasFinishedTasks,
      taskLockedForEditing,
      taskDone,
      taskWhatsNextSet,
      shouldTreatAsComment,
      myElement,
      isMyCommentOrLink,
    };
  }, [element, owner]);
}
