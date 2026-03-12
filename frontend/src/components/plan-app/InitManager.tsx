import React, { useEffect } from 'react';
import { useAppDispatch } from '../../store/planApp/hooks';
import { getPlan } from '../../store/planApp/planAppThunks';

const InitManager: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize plan loading
    dispatch(getPlan());
  }, [dispatch]);

  return null;
};

export default InitManager;
