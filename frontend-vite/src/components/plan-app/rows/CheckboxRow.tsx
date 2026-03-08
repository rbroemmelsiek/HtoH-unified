import React, { useState, useRef, useEffect } from 'react';
import { PlanRow } from '../../../types/planApp/planRow';
import { useAppDispatch, useAppSelector } from '../../../store/planApp/hooks';
import { updateElementLocal } from '../../../store/planApp/planAppSlice';
import { rowDelete, rowAdd, rowUpdate } from '../../../store/planApp/planAppThunks';
import {
  setDonePanelTasksCount,
  setLocalDonePanelTasksCount,
  setTotalPanelTasksCount,
  setLocalTotalPanelTasksCount,
  setEnabledWhatsNextCountRecursive,
  setLocalEnabledWhatsNextCountRecursive,
} from '../../../store/planApp/planAppThunks';
import { selectGlobalMode, selectAppMode } from '../../../store/planApp/planAppSelectors';
import Toolbar from '../toolbar/Toolbar';
import { useEditingPermissions } from '../../../hooks/useEditingPermissions';
import getDummyElement from '../../../utils/getDummyElement';
import DragHandler from './DragHandler';
import OpenCloseIcon from './OpenCloseIcon';

interface CheckboxRowProps {
  element: PlanRow;
}

enum TaskStatus {
  NEW = 0,
  DONE = 1,
  NEXT = 2,
}

const CheckboxRow: React.FC<CheckboxRowProps> = ({ element }) => {
  const dispatch = useAppDispatch();
  const globalMode = useAppSelector(selectGlobalMode);
  const appMode = useAppSelector(selectAppMode);
  const [isHovered, setIsHovered] = useState(false);
  const [minHeightClass, setMinHeightClass] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const permissions = useEditingPermissions(element);

  const hasChildren = element.children.length > 0;
  const checked = element.checked === TaskStatus.DONE;
  const whatsnext = element.checked === TaskStatus.NEXT;

  const cycle = () => {
    if (
      globalMode === 'client' ||
      globalMode === 'viewonly' ||
      appMode === 'template' ||
      globalMode === 'namedViewonly'
    ) {
      return;
    }

    if (!element.visible) return;

    if (element.checked === TaskStatus.NEW) {
      setNext();
    } else if (element.checked === TaskStatus.NEXT) {
      setDone();
    } else if (element.checked === TaskStatus.DONE) {
      clearStatus();
    }
  };

  const setNext = () => {
    // TODO: Implement parent tracking
    dispatch(
      rowUpdate({
        el: element,
        update: [
          ['checked', TaskStatus.NEXT],
          ['date', null],
        ],
      })
    );
  };

  const setDone = () => {
    const now = Math.floor(Date.now() / 1000).toString();
    dispatch(
      rowUpdate({
        el: element,
        update: [
          ['checked', TaskStatus.DONE],
          ['date', now],
        ],
      })
    );
  };

  const clearStatus = () => {
    dispatch(
      rowUpdate({
        el: element,
        update: [
          ['checked', TaskStatus.NEW],
          ['date', null],
        ],
      })
    );
  };

  const toggleOpen = (event?: React.MouseEvent) => {
    const source = event?.target as HTMLElement;
    if (source?.className.includes('deny-toggle')) return;
    dispatch(
      updateElementLocal({
        el: element,
        update: [['opened', !element.opened]],
      })
    );
  };

  const deleteEl = (forceDelete = false) => {
    if (hasChildren && !forceDelete) {
      dispatch(
        updateElementLocal({
          el: element,
          update: [['opened', true]],
        })
      );
    } else {
      dispatch(rowDelete({ el: element }));
    }
  };

  const addNewEl = (type: string) => {
    const newEl = getDummyElement(type as any, element.eid);
    dispatch(rowAdd({ el: newEl, family: element.children, parentEid: element.eid }));
    dispatch(
      updateElementLocal({
        el: element,
        update: [['opened', true]],
      })
    );
  };

  return (
    <div
      className={`entry__checkbox ${hasChildren ? 'imply-toggle-possible' : ''} ${whatsnext ? 'whatsnext' : ''} ${isHovered ? 'hovered' : ''} ${minHeightClass ? 'min-height-delete' : ''}`}
      onClick={toggleOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="section">
        <div className="section section__main" ref={mainRef}>
          <div className="plan-app__entry__icons">
            <DragHandler hovered={isHovered} />
            <OpenCloseIcon element={element} />
            <input
              type="checkbox"
              checked={checked}
              onChange={cycle}
              onClick={(e) => e.stopPropagation()}
              className="deny-toggle"
            />
          </div>
          <div className="plan-app__entry__body" ref={bodyRef} onClick={(e) => e.stopPropagation()}>
            {!element.edit && (
              <span 
                className="entry__header deny-toggle" 
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch(
                    updateElementLocal({
                      el: element,
                      update: [['edit', true]],
                    })
                  );
                }}
                style={{ cursor: 'text', userSelect: 'none' }}
              >
                {element.name || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Click to name</span>}
              </span>
            )}
            {element.edit && (
              <input
                type="text"
                value={element.name || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  dispatch(
                    updateElementLocal({
                      el: element,
                      update: [['name', e.target.value]],
                    })
                  );
                }}
                onBlur={() => {
                  dispatch(
                    updateElementLocal({
                      el: element,
                      update: [['edit', false]],
                    })
                  );
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                  e.stopPropagation();
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.25em 0.5em',
                  border: '1px solid #5972d0',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                }}
              />
            )}
          </div>
        </div>
        <div className="section section__actions" ref={actionsRef}>
          <Toolbar
            element={element}
            desktopSeen={isHovered}
            onDeleteEl={() => deleteEl()}
            onAddNewEl={addNewEl}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckboxRow;
