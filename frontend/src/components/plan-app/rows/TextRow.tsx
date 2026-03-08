import React, { useState, useRef, useEffect } from 'react';
import { PlanRow } from '../../../types/planApp/planRow';
import { useAppDispatch } from '../../../store/planApp/hooks';
import { updateElementLocal } from '../../../store/planApp/planAppSlice';
import { rowDelete, rowAdd } from '../../../store/planApp/planAppThunks';
import Toolbar from '../toolbar/Toolbar';
import { useEditingPermissions } from '../../../hooks/useEditingPermissions';
import getDummyElement from '../../../utils/getDummyElement';
import DragHandler from './DragHandler';
import OpenCloseIcon from './OpenCloseIcon';

interface TextRowProps {
  element: PlanRow;
}

const TextRow: React.FC<TextRowProps> = ({ element }) => {
  const dispatch = useAppDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [minHeightClass, setMinHeightClass] = useState(false);
  const [popoverDynStyle, setPopoverDynStyle] = useState('');
  const mainRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const permissions = useEditingPermissions(element);

  const hasChildren = element.children.length > 0;

  const isPhoneNumber = (() => {
    if (!element.name) return false;
    const text = element.name.trim();
    if (!text) return false;
    const clean = text.replace(/[\s\-\(\)\.]/g, '');
    return /^[\d\+\-\(\)\.\s]+$/.test(text) && clean.length >= 7;
  })();

  const isDenyToggleElement = (event?: React.MouseEvent): boolean => {
    if (!event) return false;
    const source = event.target as HTMLElement;
    if (source instanceof SVGElement) return true;
    return source.className.includes('deny-toggle');
  };

  const toggleOpen = (event?: React.MouseEvent) => {
    if (isDenyToggleElement(event)) return;
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
      // TODO: Show delete confirmation
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

  // Focus input when entering edit mode
  useEffect(() => {
    if (element.edit && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [element.edit]);

  return (
    <div
      className={`entry__text ${hasChildren ? 'imply-toggle-possible' : ''} ${isHovered ? 'hovered' : ''} ${minHeightClass ? 'min-height-delete' : ''}`}
      onClick={toggleOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="section">
        <div className="section section__main" ref={mainRef}>
          <div className="plan-app__entry__icons">
            <DragHandler hovered={isHovered} />
            <OpenCloseIcon element={element} />
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
                ref={inputRef}
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
    </div>
  );
};

export default TextRow;
