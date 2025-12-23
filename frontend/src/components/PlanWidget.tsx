
import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import EmbeddedPlanApp from './plan-app-v2/EmbeddedPlanApp';
// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion


interface PlanWidgetProps {
  isExpanded?: boolean;
  onClose?: () => void;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
  planId?: string;
  ownerId?: string;
  showNav?: boolean; // Control nav bar visibility
  loadKey?: number; // Force wrapper remounts when expansion context changes
}

export const PlanWidget: React.FC<PlanWidgetProps> = ({
  isExpanded = true,
  onClose,
  onToggleFullScreen,
  isFullScreen = false,
  planId = 'plan',
  ownerId = '0',
  showNav = true, // Show nav in expanded mode by default
  loadKey = 0
}) => {
  const planBodyRef = useRef<HTMLDivElement>(null);
  // Use Vue wrapper instead of iframe
  // This provides better integration and shared state

  __agentLog('H1','PlanWidget.tsx:render','PlanWidget render',{planId,ownerId,showNav,isExpanded,isFullScreen,loadKey});

  useEffect(() => {
    const el = planBodyRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    __agentLog('H1','PlanWidget.tsx:scrollMetrics','plan body scroll metrics',{
      overflow: cs.overflow,
      overflowY: cs.overflowY,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      canScroll: el.scrollHeight > el.clientHeight
    });
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0 relative z-20">
        <div className="flex items-center gap-2 text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="font-semibold">Service Plan</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`http://localhost:${import.meta.env.VITE_PLAN_APP_PORT || '5174'}/?plantype=${planId}&owner=${ownerId}&page=widget&sessiontype=AGENT&nav=${showNav}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={18} />
          </a>
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
              title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* React Plan App Container - Full height */}
      <div ref={planBodyRef} data-plan-scroll-container="plan-widget" className="flex-1 relative bg-gray-100 overflow-x-hidden overflow-y-auto" style={{ minHeight: 0 }}>
        <EmbeddedPlanApp
          key={`plan-app-${loadKey}`}
          planId={planId}
          ownerId={ownerId}
          mode="widget"
          sessionType="AGENT"
          showNav={showNav}
          keyId=""
        />
      </div>

      {/* Footer Status */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <span>Real-time sync via Firebase</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Connected
        </span>
      </div>
    </div>
  );
};
