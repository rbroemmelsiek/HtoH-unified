import React from 'react';
import { PlanRow } from '../../../types/planApp/planRow';

interface OpenCloseIconProps {
  element: PlanRow;
}

const OpenCloseIcon: React.FC<OpenCloseIconProps> = ({ element }) => {
  const hasChildren = element.children.length > 0;
  const iconClass = element.opened ? 'fa fa-caret-down' : 'fa fa-caret-right';

  if (!hasChildren) {
    return null;
  }

  return (
    <i
      className={iconClass}
      style={{
        width: '1em',
        textAlign: 'center',
        color: element.type === 'panel' ? 'white' : 'black',
      }}
    />
  );
};

export default OpenCloseIcon;
