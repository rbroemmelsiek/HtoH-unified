import React from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import AcademyApp from './ai-academy-v1/App';


export function AiAcademyWidget({ onClose, onToggleFullScreen, isFullScreen, agentId, agentName }: { onClose: () => void; onToggleFullScreen?: () => void; isFullScreen?: boolean; agentId?: string; agentName?: string }) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0">
        <div className="flex flex-col text-white">
          <div className="font-semibold">Ai Academy</div>
          <div className="text-[11px] text-white/70">Agent: {agentName || agentId || "(unassigned)"}</div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleFullScreen && (
            <button onClick={onToggleFullScreen} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white" title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white" title="Close">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {/* AcademyApp uses its own full layout; allow it to fill */}
        {/* Set data attributes for route detection (similar to PlanApp pattern) */}
        <div id="academy-app-options" data-mode="widget" data-chat="false" style={{ display: 'contents' }}>
          <AcademyApp />
        </div>
      </div>
    </div>
  );
}
