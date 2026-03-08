import React, { useState, useEffect, useRef } from 'react';
import { PlanRow } from '../../../types/planApp/planRow';
import EditButtonsBlock from './EditButtonsBlock';
import AddButtonsBlock from './AddButtonsBlock';
import { useAppSelector } from '../../../store/planApp/hooks';
import { selectWindowResizeFlag } from '../../../store/planApp/planAppSelectors';
import { useOnClickOutside } from '../../../hooks/useOnClickOutside';

interface ToolbarProps {
  element: PlanRow;
  desktopSeen: boolean;
  onDeleteEl: () => void;
  onAddNewEl: (type: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  element,
  desktopSeen,
  onDeleteEl,
  onAddNewEl,
}) => {
  const windowResizeFlag = useAppSelector(selectWindowResizeFlag);
  const [mobileButtonsSeen, setMobileButtonsSeen] = useState(false);
  const [smallDisplay, setSmallDisplay] = useState(false);
  const mobileToolbarRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(mobileToolbarRef, () => {
    if (mobileButtonsSeen) {
      setMobileButtonsSeen(false);
    }
  });

  useEffect(() => {
    const computeSmallDisplay = (): boolean => {
      const iframeMode =
        typeof document !== 'undefined' &&
        document.body.classList.contains('iframe-mode');
      if (iframeMode) {
        return false;
      }
      return window.innerWidth < 992;
    };

    setSmallDisplay(computeSmallDisplay());
  }, [windowResizeFlag]);

  const isExist = !element.videoEdit;

  if (!isExist) {
    return null;
  }

  if (!smallDisplay) {
    // Desktop view
    if (!desktopSeen) {
      return null;
    }

    return (
      <div className="section section__actions plan-app__entry__icons">
        <div className="holder">
          <EditButtonsBlock element={element} onDeleteEl={onDeleteEl} />
          <AddButtonsBlock element={element} onAddNewEl={onAddNewEl} />
        </div>
      </div>
    );
  }

  // Mobile view
  return (
    <div
      ref={mobileToolbarRef}
      className="section section__actions plan-app__entry__icons"
    >
      <div className="plan-dropdown icons__block mobile-toolbar">
        {!mobileButtonsSeen && (
          <i
            className="fas fa-cog plan-dropdown__opener deny-toggle"
            onClick={() => setMobileButtonsSeen(true)}
            title="Show edit tools"
            style={{
              width: '1.5em',
              height: '1.5em',
              fontSize: '1.25em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease',
            }}
          />
        )}
        {mobileButtonsSeen && (
          <div className="holder mobile-toolbar__menu">
            <EditButtonsBlock
              element={element}
              onDeleteEl={onDeleteEl}
              onHide={() => setMobileButtonsSeen(false)}
            />
            <AddButtonsBlock element={element} onAddNewEl={onAddNewEl} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
