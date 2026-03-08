import React, { useState, useRef, useEffect } from 'react';
import { PlanRow } from '../../../types/planApp/planRow';
import { useAppSelector, useAppDispatch } from '../../../store/planApp/hooks';
import {
  selectOpenedByNav,
  selectNavStepHovered,
} from '../../../store/planApp/planAppSelectors';
import {
  setNavStepHovered,
  updateElementLocal,
  addOpenedByNav,
  removeOpenedByNav,
} from '../../../store/planApp/planAppSlice';
import { rowDelete, rowAdd, rowUpdate } from '../../../store/planApp/planAppThunks';
import Toolbar from '../toolbar/Toolbar';
import { useEditingPermissions } from '../../../hooks/useEditingPermissions';
import getDummyElement from '../../../utils/getDummyElement';
import DragHandler from './DragHandler';
import OpenCloseIcon from './OpenCloseIcon';
import DeleteConfirmation from './DeleteConfirmation';

interface PanelRowProps {
  element: PlanRow;
}

const PanelRow: React.FC<PanelRowProps> = ({ element }) => {
  const dispatch = useAppDispatch();
  const openedByNav = useAppSelector(selectOpenedByNav);
  const navStepHovered = useAppSelector(selectNavStepHovered);
  const [isHovered, setIsHovered] = useState(false);
  const [minHeightClass, setMinHeightClass] = useState(false);
  const [popoverDynStyle, setPopoverDynStyle] = useState('');
  const [deleteDynStyle, setDeleteDynStyle] = useState('');
  const mainRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const permissions = useEditingPermissions(element);

  // Focus input when entering edit mode
  useEffect(() => {
    if (element.edit && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [element.edit]);

  const hasChildren = element.children.length > 0;
  const isOpenedByNav = openedByNav === element.eid;
  const isHoveredByNav = navStepHovered === element.eid;
  const allTaskSDone =
    element.doneTasks &&
    element.totalTasks &&
    element.doneTasks === element.totalTasks;

  useEffect(() => {
    if (isHovered) {
      dispatch(setNavStepHovered(element.eid));
    } else {
      dispatch(setNavStepHovered(''));
    }
  }, [isHovered, dispatch, element.eid]);

  const isDenyToggleElement = (event?: React.MouseEvent): boolean => {
    if (!event) return false;
    const source = event.target as HTMLElement;
    if (source instanceof SVGElement) {
      return true;
    }
    // Check if clicked element or any parent has deny-toggle class
    let current: HTMLElement | null = source;
    while (current) {
      if (current.className && typeof current.className === 'string' && current.className.includes('deny-toggle')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  };

  const togglePanel = (event: React.MouseEvent) => {
    // Don't toggle if clicking on input or editable elements
    if (isDenyToggleElement(event)) {
      return;
    }
    // Don't toggle if in edit mode
    if (element.edit) {
      return;
    }
    if (element.opened) {
      panelClose();
    } else {
      panelOpen();
    }
  };

  const panelOpen = () => {
    dispatch(
      updateElementLocal({
        el: element,
        update: [['opened', true]],
      })
    );
    dispatch(addOpenedByNav(element.eid));
  };

  const panelClose = () => {
    dispatch(
      updateElementLocal({
        el: element,
        update: [['opened', false]],
      })
    );
    dispatch(removeOpenedByNav());
  };

  const setPopoverDynStyleHandler = () => {
    if (!mainRef.current || !bodyRef.current || !actionsRef.current) return;

    const mainWidth = mainRef.current.offsetWidth;
    const bodyWidth = bodyRef.current.offsetWidth;
    const actionsWidth = actionsRef.current.offsetWidth;

    if (bodyWidth < 300) {
      const totalWidth = mainWidth + actionsWidth;
      const leftShift = mainWidth - bodyWidth;
      setPopoverDynStyle(`max-width: ${totalWidth}px; left: -${leftShift}px`);
    } else {
      setPopoverDynStyle(`max-width: ${bodyWidth}px`);
    }
  };

  const setDeleteDynStyleHandler = () => {
    if (!mainRef.current) return;
    const parentWidth = mainRef.current.offsetWidth;
    setDeleteDynStyle(`max-width: ${parentWidth}px`);
  };

  const deleteEl = (forceDelete = false) => {
    if (hasChildren && !forceDelete) {
      panelOpen();
      confirmDeleteShow();
    } else {
      // Find parent - in React we'll need to pass parent context differently
      // For now, use root children as fallback
      dispatch(
        rowDelete({
          el: element,
          family: undefined, // Will use root.children in thunk
        })
      );
    }
  };

  const addNewEl = (
    type: 'panel' | 'text' | 'checkbox' | 'link' | 'comment' | 'root'
  ) => {
    // Always allow adding children, even if panel has no name
    const newEl = getDummyElement(type, element.eid);

    // Mark new comment or link as unread but only if work in plan mode (not template)
    const appMode = 'plan'; // TODO: Get from selector
    if (appMode === 'plan' && (type === 'comment' || type === 'link')) {
      newEl.checked = 1; // using checked field as unread mark
    }

    let family = element.children;
    const payload: {
      el: PlanRow;
      family: PlanRow[];
      oldPos?: number;
      newPos?: number;
      parentEid?: string;
    } = { 
      el: newEl, 
      family: family, 
      parentEid: element.eid,
      newPos: family.length,
      oldPos: 100 * 100,
    };

    // If the parent type is comment or link - put children in the same hierarchy level
    if (element.type === 'comment' || element.type === 'link') {
      // In React, we'll need parent context - for now use element.children
      family = element.children;
      const curPos = element.pos;
      newEl.pos = curPos + 1;
      newEl.pid = element.pid;
      payload.el = newEl;
      payload.family = family;
      payload.oldPos = 100 * 100;
      payload.newPos = newEl.pos;
      payload.parentEid = element.pid === 'root' ? 'root' : element.pid;
    }

    dispatch(rowAdd(payload));
    // Always open panel when adding children
    if (!element.opened) {
      panelOpen();
    }
  };

  const confirmDelete = () => {
    deleteEl(true);
  };

  const cancelDelete = () => {
    setMinHeightClass(false);
  };

  const confirmDeleteShow = () => {
    setMinHeightClass(true);
    setDeleteDynStyleHandler();
    // TODO: Show delete confirmation popover
  };

  return (
    <div
      id={element.eid}
      className={`entry__panel ${
        hasChildren ? 'imply-toggle-possible' : ''
      } ${isHovered || isHoveredByNav ? 'hovered' : ''} ${
        minHeightClass ? 'min-height-delete' : ''
      } ${isOpenedByNav ? 'navOpened' : ''} ${allTaskSDone ? 'done' : ''}`}
      onClick={togglePanel}
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
            {!element.edit && !element.videoEdit && (
              <span 
                className="entry__header deny-toggle" 
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Click on name to edit
                  dispatch(
                    updateElementLocal({
                      el: element,
                      update: [['edit', true]],
                    })
                  );
                }}
                style={{ cursor: 'text', minWidth: '100px', display: 'inline-block', userSelect: 'none' }}
              >
                {element.name || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Click to name panel</span>}
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
                  // Only exit edit mode if name is not empty, or allow empty for new panels
                  dispatch(
                    updateElementLocal({
                      el: element,
                      update: [['edit', false]],
                    })
                  );
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(
                      updateElementLocal({
                        el: element,
                        update: [['edit', false]],
                      })
                    );
                  } else {
                    e.stopPropagation();
                  }
                }}
                autoFocus
                placeholder="Panel name"
                style={{
                  width: '100%',
                  padding: '0.25em 0.5em',
                  border: '1px solid #5972d0',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  backgroundColor: 'white',
                  color: '#141D84',
                  outline: 'none',
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
      {minHeightClass && (
        <div style={{ position: 'relative' }}>
          <DeleteConfirmation
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            elementName={element.name}
            hasChildren={hasChildren}
            style={deleteDynStyle ? { maxWidth: deleteDynStyle } : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default PanelRow;
