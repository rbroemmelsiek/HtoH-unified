import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/planApp/hooks';
import { selectModalVisible, selectModalVideoSrc } from '../../store/planApp/planAppSelectors';
import { hideModal } from '../../store/planApp/planAppSlice';

const GlobalModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const modalVisible = useAppSelector(selectModalVisible);
  const modalVideoSrc = useAppSelector(selectModalVideoSrc);

  if (!modalVisible) {
    return null;
  }

  return (
    <div
      className="plan-app__modal"
      onClick={() => dispatch(hideModal())}
    >
      <div className="plan-app__modal__content" onClick={(e) => e.stopPropagation()}>
        {modalVideoSrc && (
          <video src={modalVideoSrc} controls autoPlay />
        )}
        <button onClick={() => dispatch(hideModal())}>Close</button>
      </div>
    </div>
  );
};

export default GlobalModal;
