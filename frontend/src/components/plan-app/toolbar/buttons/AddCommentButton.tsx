import React, { useEffect } from 'react';
import { PlanRow } from '../../../../types/planApp/planRow';
import { useAppSelector } from '../../../../store/planApp/hooks';
import {
  selectIsAmbassadorOrClient,
  selectGlobalMode,
  selectMode,
} from '../../../../store/planApp/planAppSelectors';

interface AddCommentButtonProps {
  element: PlanRow;
  onAddNewEl: (type: string) => void;
  onExist?: () => void;
}

const AddCommentButton: React.FC<AddCommentButtonProps> = ({
  element,
  onAddNewEl,
  onExist,
}) => {
  const isAmbassadorOrClient = useAppSelector(selectIsAmbassadorOrClient);
  const globalMode = useAppSelector(selectGlobalMode);
  const mode = useAppSelector(selectMode);

  const elementExist = (() => {
    const isWidget = globalMode === 'widget' || mode === 'widget';
    if (isWidget) {
      return true;
    }
    return isAmbassadorOrClient;
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

  const commentsCounterSeen = !!(
    element.commentsCount || element.unreadCommentsCount || 0
  );
  const displayCount = element.unreadCommentsCount || element.commentsCount || 0;
  const commentElClass =
    displayCount <= 1 ? 'fa-comment' : 'fa-comments';

  return (
    <span className="icon-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25em' }}>
      <i
        className={`fas fa-fw fa-fw--thin ${commentElClass}`}
        onClick={(e) => {
          e.stopPropagation();
          onAddNewEl('comment');
        }}
        title="Add comment"
      />
      {commentsCounterSeen && (
        <span
          className="plan-badge comments-counter"
          title={
            element.unreadCommentsCount
              ? `Unread messages: ${element.unreadCommentsCount}`
              : `Total comments: ${element.commentsCount || 0}`
          }
          onClick={(e) => {
            e.stopPropagation();
            onAddNewEl('comment');
          }}
          style={{
            fontSize: '0.75em',
            backgroundColor: '#5972d0',
            color: 'white',
            borderRadius: '50%',
            minWidth: '1.2em',
            height: '1.2em',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 0.3em',
            marginLeft: '0.25em',
          }}
        >
          {displayCount}
        </span>
      )}
    </span>
  );
};

export default AddCommentButton;
