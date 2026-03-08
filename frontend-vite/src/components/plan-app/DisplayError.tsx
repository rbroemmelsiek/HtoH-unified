import React from 'react';
import { useAppSelector } from '../../store/planApp/hooks';
import { selectTreeError, selectTreeErrorMsg } from '../../store/planApp/planAppSelectors';

const DisplayError: React.FC = () => {
  const treeError = useAppSelector(selectTreeError);
  const treeErrorMsg = useAppSelector(selectTreeErrorMsg);

  if (!treeError) {
    return null;
  }

  return (
    <div className="plan-app__error">
      <p>{treeErrorMsg}</p>
    </div>
  );
};

export default DisplayError;
