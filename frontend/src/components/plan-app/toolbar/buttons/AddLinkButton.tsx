import React, { useEffect } from 'react';
import { PlanRow } from '../../../../types/planApp/planRow';
import { useAppSelector } from '../../../../store/planApp/hooks';
import {
  selectIsAmbassadorOrTemplate,
  selectIsAmbassadorOrClient,
  selectGlobalMode,
  selectMode,
} from '../../../../store/planApp/planAppSelectors';

interface AddLinkButtonProps {
  element: PlanRow;
  onAddNewEl: (type: string) => void;
  onExist?: () => void;
}

const AddLinkButton: React.FC<AddLinkButtonProps> = ({
  element,
  onAddNewEl,
  onExist,
}) => {
  const isAmbassadorOrTemplate = useAppSelector(selectIsAmbassadorOrTemplate);
  const isAmbassadorOrClient = useAppSelector(selectIsAmbassadorOrClient);
  const globalMode = useAppSelector(selectGlobalMode);
  const mode = useAppSelector(selectMode);

  const elementExist = (() => {
    const isWidget = globalMode === 'widget' || mode === 'widget';
    if (isWidget) {
      return true;
    }
    return isAmbassadorOrClient || isAmbassadorOrTemplate;
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
      className="fas fa-fw fa-fw--thin fa-link icon-item"
      onClick={(e) => {
        e.stopPropagation();
        onAddNewEl('link');
      }}
      title="Add link"
      style={{ transform: 'scaleX(-1)' }}
    />
  );
};

export default AddLinkButton;
