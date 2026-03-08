
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';
import { hasTaskDescendant, findRowInTree } from '../utils/planHelpers';
import { PlanRow } from '../types';
import { CaretRightFillIcon, BoldCheckIcon } from './Icons';

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

const ProgressNav: React.FC = () => {
  const { state, dispatch } = usePlan();
  const navContainerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isCompact, setIsCompact] = useState(false);

  const navItems = state.plan.root.children.filter(
    (panel) => panel.type === 'panel' && hasTaskDescendant(panel)
  );

  labelRefs.current = [];

  useEffect(() => {
    setIsCompact(false);
  }, [navItems.length]);

  useEffect(() => {
    const handleResize = () => setIsCompact(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useLayoutEffect(() => {
    if (isCompact) return; 

    const checkTruncation = () => {
      if (!labelRefs.current.length || navItems.length === 0) return;
      let truncatedCount = 0;
      let total = 0;
      labelRefs.current.forEach((el) => {
        if (el) {
          total++;
          if (el.scrollWidth > el.clientWidth) truncatedCount++;
        }
      });
      if (total > 0 && (truncatedCount / total) > 0.5) {
        setIsCompact(true);
      }
    };
    checkTruncation();
  }, [navItems, state.plan, isCompact]); 

  if (navItems.length === 0) return null;

  const getScrollContainer = () => {
    // PlanWidget provides the scroll container when embedded
    const el = document.querySelector('[data-plan-scroll-container="plan-widget"]') as HTMLElement | null;
    return el || null;
  };

  const scrollToPanel = (eid: string, index: number) => {
    const scroller = getScrollContainer();

    // Special case for the first panel: scroll to top
    if (index === 0) {
      if (scroller) {
        __agentLog('H1','ProgressNav.tsx:scrollTop','scroll to top (scroller)',{scrollTop: scroller.scrollTop});
        scroller.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        __agentLog('H1','ProgressNav.tsx:scrollTop','scroll to top (window)',{});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const element = document.getElementById(eid);
    if (!element) {
      __agentLog('H1','ProgressNav.tsx:scrollToPanel','target element missing',{eid});
      return;
    }

    const navHeight = navContainerRef.current?.getBoundingClientRect().height || 55;

    if (scroller) {
      const scrollerRect = scroller.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const offsetWithinScroller = (elementRect.top - scrollerRect.top) + scroller.scrollTop;
      const top = Math.max(0, offsetWithinScroller - navHeight - 12);
      __agentLog('H1','ProgressNav.tsx:scrollToPanel','scroll within scroller',{eid,index,navHeight,scrollerScrollTop: scroller.scrollTop,targetTop: top});
      scroller.scrollTo({ top, behavior: 'smooth' });
      return;
    }

    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - navHeight - 12;
    __agentLog('H1','ProgressNav.tsx:scrollToPanel','scroll within window',{eid,index,navHeight,targetTop: offsetPosition});
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  };

  const handleNavClick = (eid: string, index: number) => {
    __agentLog('H1','ProgressNav.tsx:navClick','nav click',{eid,index});
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      const panel = findRowInTree(state.plan.root.children, eid);
      if (!panel) return;
      
      // Fixed Toggle logic: Reliable single click open/close
      if (!panel.opened) {
          dispatch({ type: 'TOGGLE_OPEN', payload: eid });
          // Delay scroll until toggle re-render starts
          setTimeout(() => scrollToPanel(eid, index), 50);
      } else {
          dispatch({ type: 'TOGGLE_OPEN', payload: eid });
      }
      clickTimerRef.current = null;
    }, 250);
  };

  const handleNavDoubleClick = (eid: string, index: number) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      
      const openCount = navItems.filter(p => p.opened).length;
      const shouldOpen = openCount < (navItems.length / 2 + 0.5);
      
      dispatch({ type: 'TOGGLE_ALL', payload: shouldOpen }); 
      
      // Always scroll to the double-clicked item regardless of open/close
      setTimeout(() => scrollToPanel(eid, index), 100);
  };

  const handleMouseEnter = (eid: string) => {
    dispatch({ type: 'SET_HOVERED_ROW', payload: eid });
  };

  const handleMouseLeave = () => {
    dispatch({ type: 'SET_HOVERED_ROW', payload: null });
  };

  const getPanelStats = (panel: PlanRow) => {
    let total = 0, nextCount = 0, doneCount = 0, yellowCount = 0, redCount = 0, completedStrict = 0;
    const countTasks = (rows: PlanRow[]) => {
      for (const row of rows) {
        if (row.type === 'checkbox') {
          total++;
          if (row.checked === 4) completedStrict++;
          if (row.checked === 1) nextCount++;
          if (row.checked === 4) doneCount++;
          if (row.checked === 2) yellowCount++;
          if (row.checked === 3) redCount++;
        }
        if (row.children) countTasks(row.children);
      }
    };
    countTasks(panel.children);
    return { total, nextCount, doneCount, yellowCount, redCount, completedStrict };
  };

  const getWrapperStyle = (index: number) => {
    if (isCompact) {
        return {
            zIndex: (navItems.length - index) + 10,
            borderRight: index < navItems.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none',
        };
    }
    const arrowSize = '1.2rem';
    const gapSize = '4px';
    const style: React.CSSProperties = { zIndex: (navItems.length - index) + 10 };
    if (index > 0) style.marginLeft = `calc(-${arrowSize} + ${gapSize})`;
    return style;
  };

  const getButtonStyle = (index: number, stats: ReturnType<typeof getPanelStats>, isComplete: boolean, isHovered: boolean) => {
    const arrowSize = '1.2rem';
    const { total, nextCount, doneCount, yellowCount, redCount } = stats;
    const baseColor = '#141D84'; 

    const hoverOverlay = isHovered 
        ? 'linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0.3)), ' 
        : '';

    const bevelGradient = `linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 10%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 90%, rgba(0,0,0,0.4) 100%)`;
    const fadeMask = `linear-gradient(to right, ${isHovered ? 'rgba(26, 37, 160, 0)' : 'rgba(20, 29, 132, 0)'} 0%, ${isHovered ? 'rgba(26, 37, 160, 0.1)' : 'rgba(20, 29, 132, 0.1)'} 40%, ${isHovered ? 'rgba(26, 37, 160, 0.5)' : 'rgba(20, 29, 132, 0.5)'} 70%, ${isHovered ? 'rgba(26, 37, 160, 0.95)' : 'rgba(20, 29, 132, 0.95)'} 100%)`;

    let backgroundStr;
    if (isComplete) {
        const completeColor = '#15803d'; 
        backgroundStr = `${hoverOverlay}${bevelGradient}, ${completeColor}`;
    } else if (total > 0) {
        const pctNext = (nextCount / total) * 100;
        const pctDone = (doneCount / total) * 100;
        const pctYellow = (yellowCount / total) * 100;
        const pctRed = (redCount / total) * 100;
        let stops = [];
        let currentPct = 0;

        if (pctDone > 0) {
            stops.push(`rgba(34, 197, 94, 0.95) ${currentPct}%`);
            currentPct += pctDone;
            stops.push(`rgba(34, 197, 94, 0.95) ${currentPct}%`);
        }
        if (pctNext > 0) {
            stops.push(`rgba(34, 197, 94, 0.7) ${currentPct}%`); 
            currentPct += pctNext;
            stops.push(`rgba(34, 197, 94, 0.25) ${currentPct}%`);
        }
        if (pctYellow > 0) {
            stops.push(`rgba(234, 179, 8, 0.7) ${currentPct}%`);
            currentPct += pctYellow;
            stops.push(`rgba(234, 179, 8, 0.2) ${currentPct}%`);
        }
        if (pctRed > 0) {
            stops.push(`rgba(239, 68, 68, 0.7) ${currentPct}%`);
            currentPct += pctRed;
            stops.push(`rgba(239, 68, 68, 0.2) ${currentPct}%`);
        }
        stops.push(`transparent ${currentPct}%`);
        const multiColorGradient = `linear-gradient(to right, ${stops.join(', ')})`;
        backgroundStr = `${hoverOverlay}${bevelGradient}, ${fadeMask}, ${multiColorGradient}, ${baseColor}`;
    } else {
        backgroundStr = `${hoverOverlay}${bevelGradient}, ${baseColor}`;
    }

    let clipPath, paddingLeft = '0.5rem', paddingRight = '0.5rem';
    if (isCompact) {
        clipPath = 'none'; 
        paddingLeft = '0.25rem';
        paddingRight = '0.25rem';
    } else {
        const isLast = (index === navItems.length - 1);
        paddingLeft = index === 0 ? '0.75rem' : `calc(${arrowSize} + 0.5rem)`;
        paddingRight = isLast ? '1.25rem' : arrowSize; 
        
        if (index === 0) {
          clipPath = `polygon(0% 0%, calc(100% - ${arrowSize}) 0%, 100% 50%, calc(100% - ${arrowSize}) 100%, 0% 100%)`;
        } else if (isLast) {
          clipPath = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${arrowSize} 50%)`;
        } else {
          clipPath = `polygon(0% 0%, calc(100% - ${arrowSize}) 0%, 100% 50%, calc(100% - ${arrowSize}) 100%, 0% 100%, ${arrowSize} 50%)`;
        }
    }

    return { background: backgroundStr, clipPath: clipPath, paddingRight: paddingRight, paddingLeft: paddingLeft };
  };

  return (
    <div 
        ref={navContainerRef}
        className="sticky top-0 z-40 w-full max-w-[100vw] overflow-x-hidden bg-black border-t-[3px] border-[#04cc08] shadow-[0_4px_20px_rgba(0,0,0,0.5)] mb-6 transform-gpu"
    >
      <div className="w-full">
        <div className="flex items-stretch h-12 px-2 overflow-visible py-1">
          {navItems.map((panel, index) => {
            const stats = getPanelStats(panel);
            const isComplete = stats.total > 0 && stats.completedStrict === stats.total;
            const isHovered = state.hoveredRowId === panel.eid;

            return (
              <div 
                key={panel.eid}
                className="relative flex-grow flex min-w-0 group transition-none"
                style={getWrapperStyle(index)}
              >
                <button
                  onClick={() => handleNavClick(panel.eid, index)}
                  onDoubleClick={() => handleNavDoubleClick(panel.eid, index)}
                  onMouseEnter={() => handleMouseEnter(panel.eid)}
                  onMouseLeave={handleMouseLeave}
                  className="w-full h-full flex items-center justify-start font-medium text-white focus:outline-none touch-action-manipulation"
                  style={{
                      ...getButtonStyle(index, stats, isComplete, isHovered),
                      fontSize: isCompact ? '0.8em' : '1.0em'
                  }}
                >
                  <div className={`flex items-center w-full z-10 ${isCompact ? 'justify-center' : 'px-2'}`}>
                      {!isCompact && <CaretRightFillIcon className="flex-shrink-0 w-3 h-3 mr-1 text-white opacity-90 drop-shadow-md" />}
                      <span 
                        ref={el => { labelRefs.current[index] = el }}
                        className="truncate drop-shadow-md text-left flex-grow text-shadow-sm"
                      >
                        {panel.name || "PANEL"}
                      </span>
                  </div>
                </button>

                {isComplete && (
                   <div 
                     className="absolute z-50 pointer-events-none"
                     style={{ right: isCompact ? '-4px' : '1.75rem', top: '-2px' }}
                   >
                      <div className="w-[1.15rem] h-[1.15rem] bg-[#04cc08] rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                        <BoldCheckIcon className="w-[0.65rem] h-[0.65rem] text-white filter drop-shadow-sm" />
                      </div>
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressNav;
