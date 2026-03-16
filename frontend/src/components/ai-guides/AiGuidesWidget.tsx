import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isAiGuidesAdmin } from '../../services/aiGuides/access';
import { loadAiGuidesWithCache, fetchAiGuidesRecords } from '../../services/aiGuides/reader';
import { AiGuideRecord } from '../../services/aiGuides/types';
import { AiGuidesRuntimeView } from './AiGuidesRuntimeView';
import { AiGuidesEditorView } from './AiGuidesEditorView';

interface AiGuidesWidgetProps {
  onClose: () => void;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
}

export function AiGuidesWidget({ onClose, onToggleFullScreen, isFullScreen }: AiGuidesWidgetProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'runtime' | 'editor'>('runtime');
  const [records, setRecords] = useState<AiGuideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheState, setCacheState] = useState<'cache' | 'network' | 'none'>('none');
  const collectionName = process.env.NEXT_PUBLIC_AI_GUIDES_COLLECTION || 'AiGuides';
  const canEdit = isAiGuidesAdmin(user);

  const refresh = async () => {
    setLoading(true);
    try {
      const fresh = await fetchAiGuidesRecords(collectionName);
      setRecords(fresh);
      setCacheState('network');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await loadAiGuidesWithCache({
          collectionName,
          onBackgroundUpdate: (next) => {
            if (!cancelled) setRecords(next);
          },
        });
        if (cancelled) return;
        setRecords(data.records);
        setCacheState(data.source);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [collectionName]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0">
        <div className="text-white">
          <div className="font-semibold">Ai Guide</div>
          <div className="text-[11px] text-white/70">
            {cacheState === 'cache' ? 'cached view' : cacheState === 'network' ? 'live view' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => setMode((prev) => (prev === 'runtime' ? 'editor' : 'runtime'))}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/15 text-white hover:bg-white/25"
            >
              {mode === 'runtime' ? 'Edit' : 'View'}
            </button>
          )}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white"
              title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {mode === 'editor' && canEdit && user ? (
          <AiGuidesEditorView user={user} />
        ) : (
          <AiGuidesRuntimeView records={records} loading={loading} onRefresh={() => void refresh()} />
        )}
      </div>
    </div>
  );
}
