import React from 'react';
import { useAppSelector } from '../../../store/planApp/hooks';
import { selectIsAmbassadorOrTemplate } from '../../../store/planApp/planAppSelectors';

interface DragHandlerProps {
  hovered: boolean;
}

const DragHandler: React.FC<DragHandlerProps> = ({ hovered }) => {
  const canDrag = useAppSelector(selectIsAmbassadorOrTemplate);

  if (!canDrag) {
    return null;
  }

  return (
    <div
      className={`sort-handler ${hovered ? 'hovered' : ''}`}
      title="Drag item"
      onClick={(e) => e.stopPropagation()}
      style={{
        height: '1em',
        width: '1em',
        opacity: hovered ? 0.3 : 0,
        cursor: 'move',
        background: 'url(data:image/gif;base64,R0lGODlhDAAUAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAAMABQAAAIjFCCpZ4fromqMzXaz3rxfO1VOGI2QmIHeynpqIqqlCY8vVgAAOw==) center center no-repeat',
        backgroundSize: 'contain',
      }}
    />
  );
};

export default DragHandler;
