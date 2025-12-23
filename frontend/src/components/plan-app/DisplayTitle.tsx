import React from 'react';
import { useAppSelector } from '../../store/planApp/hooks';
import { selectName } from '../../store/planApp/planAppSelectors';

const DisplayTitle: React.FC = () => {
  const name = useAppSelector(selectName);

  if (!name) {
    return null;
  }

  return (
    <h1
      className="plan-app__title"
      style={{
        textAlign: 'center',
        fontSize: '1rem',
        fontWeight: 500,
        margin: '0.25rem 0 0.5rem',
      }}
    >
      {name}
    </h1>
  );
};

export default DisplayTitle;
