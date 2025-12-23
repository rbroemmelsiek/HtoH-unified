
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PlanRow, AddChildType } from '../../types';
import Toolbar from '../Toolbar';
import { usePlan } from '../../context/PlanContext';
import { getVisibleFlatList } from '../../utils/planHelpers';
import { getAutocompleteSuggestion } from '../../utils/aiHelpers';
import { 
  GripIcon, PlayCircleIcon, InfoIcon, MoreHorizontalIcon, 
  CaretRightFillIcon, CaretDownFillIcon, AtomIcon 
} from '../Icons';

interface RowHeaderProps {
  row: PlanRow;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  isPanel?: boolean;
}

const RowHeader: React.FC<RowHeaderProps> = ({ row, children, icon, className = '', isPanel = false }) => {
  const { state, dispatch } = usePlan();
  const [localName, setLocalName] = useState(row.name);
  const [localLink, setLocalLink] = useState(row.link);
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{top?: number, bottom?: number, right: number} | null>(null);
  
  const [ghostText, setGhostText] = useState("");
  
  const [infoOpen, setInfoOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number, left: number, transform: string } | null>(null);
  
  const infoRef = useRef<HTMLDivElement>(null);
  const kebabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const ghostMirrorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setLocalName(row.name);
    setLocalLink(row.link);
  }, [row.name, row.link]);

  useEffect(() => {
    if (!state.aiMode || !row.edit || localName.length < 2) {
      setGhostText("");
      return;
    }

    const timer = setTimeout(async () => {
      const completion = await getAutocompleteSuggestion(localName, row, state.plan);
      setGhostText(completion);
    }, 400);

    return () => clearTimeout(timer);
  }, [localName, row.edit, state.aiMode]);

  useEffect(() => {
    if (row.edit && inputRef.current) {
      inputRef.current.focus();
      if (localName && row.isNew) {
        inputRef.current.select();
      }
    }
  }, [row.edit]);

  // Update tooltip position when icon is hovered
  useEffect(() => {
    if (infoOpen && infoRef.current) {
      const rect = infoRef.current.getBoundingClientRect();
      const tooltipWidth = 320; // Matches w-80
      const tooltipMaxHeight = 320; // Matches max-h-80
      
      // Since we use 'fixed' positioning, coordinates are viewport-relative (0,0 is top-left of screen)
      // DO NOT add window.scrollY or window.scrollX
      let top = rect.bottom + 8;
      let left = rect.left - (tooltipWidth / 2) + (rect.width / 2);
      let transform = 'translateY(0)';

      // Check vertical bounds: If not enough space below, show ABOVE
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < tooltipMaxHeight && rect.top > tooltipMaxHeight) {
        top = rect.top - 8;
        transform = 'translateY(-100%)';
      }

      // Check horizontal bounds: Keep within viewport padding
      const padding = 12;
      if (left < padding) {
        left = padding;
      } else if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }

      setTooltipPos({ top, left, transform });
    } else {
      setTooltipPos(null);
    }
  }, [infoOpen]);

  const handleSave = (finalName?: string, finalLink?: string) => {
    const nameToSave = finalName !== undefined ? finalName : localName;
    const linkToSave = finalLink !== undefined ? finalLink : localLink;
    
    dispatch({ 
      type: 'FINISH_EDIT', 
      payload: { eid: row.eid, name: nameToSave, link: linkToSave } 
    });
    setGhostText("");
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (editContainerRef.current && editContainerRef.current.contains(e.relatedTarget as Node)) {
        return;
    }
    handleSave(localName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (ghostText) {
        e.preventDefault();
        const acceptedName = localName + ghostText;
        setLocalName(acceptedName);
        setGhostText("");
        return;
      }
      
      e.preventDefault();
      handleSave();
      
      const flatList = getVisibleFlatList(state.plan.root.children, state.searchTerm, state.isSearchEnabled);
      const currentIndex = flatList.findIndex(r => r.eid === row.eid);
      
      if (currentIndex !== -1 && currentIndex < flatList.length - 1) {
        dispatch({ type: 'START_EDIT', payload: flatList[currentIndex + 1].eid });
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
      return;
    }
    
    if (e.key === 'Escape') {
      setLocalName(row.name);
      setGhostText("");
      dispatch({ type: 'CANCEL_EDIT', payload: row.eid });
      return;
    }
  };

  const renderEditMode = () => {
    const ghostColorClass = isPanel ? "text-white/40" : "text-gray-400 opacity-60";
    return (
      <div ref={editContainerRef} className="flex-grow flex flex-col gap-1 w-full mr-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center pl-2 pointer-events-none select-none text-sm font-sans whitespace-pre">
            <span ref={ghostMirrorRef} className="opacity-0">{localName}</span>
            <span className={ghostColorClass}>{ghostText}</span>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={localName}
            onChange={(e) => {
              setLocalName(e.target.value);
              setGhostText("");
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={`w-full border px-2 py-1 rounded bg-transparent text-sm focus:outline-none transition-all
              ${isPanel ? 'border-white/30 text-white focus:border-white placeholder-white/30' : 'border-gray-300 text-gray-900 focus:border-blue-500 placeholder-gray-400/50'}`}
            placeholder="Name..."
          />
          {state.aiMode && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <AtomIcon className={`w-3.5 h-3.5 ${isPanel ? 'text-white/30' : 'text-[#ff6600]'}`} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDisplayMode = () => {
    return (
      <div 
        className={`flex-grow flex items-center cursor-pointer mr-2 ${isPanel ? "text-white font-bold" : "text-gray-900"} min-w-0`}
        onClick={() => dispatch({ type: 'START_EDIT', payload: row.eid })}
      >
        <span className={`truncate ${!row.name ? "italic opacity-60" : ""}`}>
            {row.name || (isPanel ? "Click to name panel" : "Click to edit")}
        </span>
        {children}
        
        {row.video && (
          <button 
             onClick={(e) => { e.stopPropagation(); dispatch({ type: 'OPEN_VIDEO', payload: row.video }); }}
             className="ml-2 p-0.5 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
          >
             <PlayCircleIcon className="w-5 h-5" />
          </button>
        )}

        {row.tooltip && (
           <div 
             ref={infoRef}
             className="relative ml-2 flex items-center"
             onMouseEnter={() => setInfoOpen(true)}
             onMouseLeave={() => setInfoOpen(false)}
             onClick={(e) => e.stopPropagation()}
           >
             <button className={isPanel ? "text-white/70" : "text-gray-400"} aria-label="Information"><InfoIcon className="w-4 h-4" /></button>
             
             {/* Portaled Tooltip */}
             {infoOpen && tooltipPos && createPortal(
                <div 
                  className="fixed z-[99999] w-80 max-h-80 overflow-y-auto bg-white rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.3)] p-4 text-xs text-gray-700 border border-gray-100 leading-relaxed ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-gray-200"
                  style={{
                    top: tooltipPos.top,
                    left: tooltipPos.left,
                    transform: tooltipPos.transform
                  }}
                >
                    {row.tooltip}
                </div>,
                document.body
             )}
           </div>
        )}
      </div>
    );
  };

  return (
    <div className={`group flex items-center w-full relative transition-all duration-300 ${row.isNew ? "bg-blue-50/30" : ""} ${className}`}>
        <div className={`mr-1 -ml-1 cursor-grab flex items-center justify-center rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isPanel ? 'text-blue-200' : 'text-gray-300'}`}>
          <GripIcon />
        </div>

        {!isPanel && (
            <div 
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_OPEN', payload: row.eid }); }} 
              className={`mr-1 cursor-pointer flex items-center justify-center w-4 h-4 transition-opacity ${row.children.length === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                {row.opened ? <CaretDownFillIcon className="w-3 h-3 text-gray-500" /> : <CaretRightFillIcon className="w-3 h-3 text-gray-400" />}
            </div>
        )}

        <div className="flex-shrink-0 mr-2 flex items-center justify-center w-6 h-6">{icon}</div>

        {row.edit ? renderEditMode() : renderDisplayMode()}

        <div className="hidden md:flex ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <Toolbar 
                element={row}
                visible={row.visible}
                onToggleVisible={() => dispatch({ type: 'TOGGLE_VISIBLE', payload: row.eid })}
                onEdit={() => dispatch({ type: 'START_EDIT', payload: row.eid })}
                onDelete={() => dispatch({ type: 'REQUEST_DELETE_ROW', payload: row.eid })}
                onSettings={() => dispatch({ type: 'OPEN_SETTINGS', payload: row.eid })}
                onAdd={(type) => dispatch({ type: 'ADD_CHILD', payload: { parentEid: row.eid, type } })}
            />
        </div>
        
        {!row.edit && (
          <button 
            ref={kebabRef}
            onClick={(e) => {
              e.stopPropagation();
              if (kebabRef.current) {
                const rect = kebabRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const menuHeight = 240; 
                
                if (spaceBelow < menuHeight) {
                  setMenuPosition({ 
                    bottom: window.innerHeight - rect.top + 4, 
                    top: undefined,
                    right: window.innerWidth - rect.right 
                  });
                } else {
                  setMenuPosition({ 
                    top: rect.bottom + 4, 
                    bottom: undefined,
                    right: window.innerWidth - rect.right 
                  });
                }
                setMobileToolbarOpen(true);
              }
            }}
            className={`md:hidden ml-auto p-2 ${isPanel ? 'text-white/70' : 'text-gray-400'}`}
          >
            <MoreHorizontalIcon />
          </button>
        )}

        {mobileToolbarOpen && menuPosition && createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setMobileToolbarOpen(false); }}></div>
            <div 
              className="fixed z-[9999]" 
              style={{ 
                top: menuPosition.top, 
                bottom: menuPosition.bottom, 
                right: menuPosition.right 
              }} 
              onClick={(e) => e.stopPropagation()}
            >
                <Toolbar 
                    element={row}
                    visible={row.visible}
                    onToggleVisible={() => { dispatch({ type: 'TOGGLE_VISIBLE', payload: row.eid }); setMobileToolbarOpen(false); }}
                    onEdit={() => { dispatch({ type: 'START_EDIT', payload: row.eid }); setMobileToolbarOpen(false); }}
                    onDelete={() => { dispatch({ type: 'REQUEST_DELETE_ROW', payload: row.eid }); setMobileToolbarOpen(false); }}
                    onSettings={() => { dispatch({ type: 'OPEN_SETTINGS', payload: row.eid }); setMobileToolbarOpen(false); }}
                    onAdd={(type) => { dispatch({ type: 'ADD_CHILD', payload: { parentEid: row.eid, type } }); setMobileToolbarOpen(false); }}
                    orientation="vertical"
                />
            </div>
          </>, document.body
        )}
    </div>
  );
};

export default RowHeader;
