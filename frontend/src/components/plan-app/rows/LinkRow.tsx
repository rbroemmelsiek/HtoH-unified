import React, { useState, useRef } from 'react';
import { PlanRow } from '../../../types/planApp/planRow';
import { useAppDispatch } from '../../../store/planApp/hooks';
import { updateElementLocal } from '../../../store/planApp/planAppSlice';
import { rowDelete, rowAdd, rowUpdate } from '../../../store/planApp/planAppThunks';
import Toolbar from '../toolbar/Toolbar';
import { useEditingPermissions } from '../../../hooks/useEditingPermissions';
import getDummyElement from '../../../utils/getDummyElement';
import OpenCloseIcon from './OpenCloseIcon';

interface LinkRowProps {
  element: PlanRow;
}

const LinkRow: React.FC<LinkRowProps> = ({ element }) => {
  const dispatch = useAppDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const [minHeightClass, setMinHeightClass] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const permissions = useEditingPermissions(element);

  const hasChildren = element.children.length > 0;
  const isUnread = element.checked === 1;

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

  const markRead = () => {
    dispatch(
      rowUpdate({
        el: element,
        update: [['checked', 0]],
      })
    );
  };

  const markReadOrToggleOpen = () => {
    if (isUnread) {
      markRead();
    } else {
      toggleOpen();
    }
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

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.link) {
      window.open(element.link, element.new_window ? '_blank' : '_self');
      markReadOrToggleOpen();
    }
  };

  return (
    <div
      className={`plan-app__entry__link ${hasChildren ? 'imply-toggle-possible' : ''} ${permissions.myElement ? 'my-element' : ''} ${isHovered ? 'hovered' : ''} ${minHeightClass ? 'min-height-delete' : ''}`}
      onClick={toggleOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="section">
        <div className="section section__main" ref={mainRef}>
          <div className="plan-app__entry__icons">
            <OpenCloseIcon element={element} />
          </div>
          <div className="plan-app__entry__body" ref={bodyRef} onClick={(e) => e.stopPropagation()}>
            {!element.edit && (
              <a
                href={element.link}
                target={element.new_window ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className={`entry__header ${isUnread ? 'bold deny-toggle' : ''}`}
                onClick={handleLinkClick}
                onMouseDown={(e) => {
                  if (!element.link) {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(
                      updateElementLocal({
                        el: element,
                        update: [['edit', true]],
                      })
                    );
                  }
                }}
                style={{ cursor: element.link ? 'pointer' : 'text' }}
              >
                {element.name || element.link || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Click to add link</span>}
              </a>
            )}
            {element.edit && (
              <div>
                <input
                  type="text"
                  placeholder="Link name"
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
                    marginBottom: '0.25em',
                  }}
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={element.link || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    dispatch(
                      updateElementLocal({
                        el: element,
                        update: [['link', e.target.value]],
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
                  style={{
                    width: '100%',
                    padding: '0.25em 0.5em',
                    border: '1px solid #5972d0',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
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

export default LinkRow;
