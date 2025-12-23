import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import DataTable from './ai-academy-v1/components/DataTable';
import { MOCK_BOOK_DATA } from './ai-academy-v1/constants';

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

export function AiAcademyHubWidget({ onClose, onToggleFullScreen, isFullScreen, agentId, agentName }: { onClose: () => void; onToggleFullScreen?: () => void; isFullScreen?: boolean; agentId?: string; agentName?: string }) {
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    __agentLog('H8','AiAcademyHubWidget.tsx:mount','mount academy hub',{agentId, agentName});
  }, [agentId, agentName]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0">
        <div className="flex flex-col text-white">
          <div className="font-semibold">Ai Hub</div>
          <div className="text-[11px] text-white/70">Agent: {agentName || agentId || '(unassigned)'} </div>
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

      <div className="flex-1 min-h-0 overflow-hidden bg-[#0a0a0f]">
        <DataTable
          data={MOCK_BOOK_DATA}
          onSelectPage={() => {}}
          onJoinLive={() => {}}
          isPaid={isPaid}
          onBuyCourse={() => setIsPaid(true)}
        />
      </div>
    </div>
  );
}
