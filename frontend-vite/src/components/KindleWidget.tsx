import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Search } from 'lucide-react';
import KindleViewer from './ai-academy-v1/components/KindleViewer';
import SearchSidebar from './ai-academy-v1/components/SearchSidebar';
import { MOCK_BOOK_DATA, INITIAL_SAMPLE_RANGE, DEFAULT_PDF_URL } from './ai-academy-v1/constants';
import { AppMode } from './ai-academy-v1/types';

const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';


// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion


function parseRange(rangeStr: string): number[] {
  const pages: number[] = [];
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((p) => parseInt(p.trim(), 10));
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let i = start; i <= end; i++) pages.push(i);
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!Number.isNaN(p)) pages.push(p);
    }
  }
  return pages;
}

export function KindleWidget({ onClose, onToggleFullScreen, isFullScreen, agentId, agentName }: { onClose: () => void; onToggleFullScreen?: () => void; isFullScreen?: boolean; agentId?: string; agentName?: string }) {
  const [isPaid, setIsPaid] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sampleRangeRaw] = useState(INITIAL_SAMPLE_RANGE);
  const samplePages = useMemo(() => parseRange(sampleRangeRaw), [sampleRangeRaw]);
  const [pdfFile, setPdfFile] = useState<string | File | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    try {
      if (!agentId) return;
      const raw = localStorage.getItem('htoh_agent_pdf_map_v1');
      const map = raw ? JSON.parse(raw) : {};
      const rec = map[agentId];
      if (rec && typeof rec.url === 'string') {
        __agentLog('H6','KindleWidget.tsx:restore','restore pdf url',{agentId, url: rec.url});
        setPdfFile(rec.url);
      }
    } catch (e) {
      __agentLog('H6','KindleWidget.tsx:restoreError','restore error',{message: String(e)});
    }
    // only on agent change
  }, [agentId]);

  const pdfLabel = pdfFile instanceof File ? pdfFile.name : (pdfFile ? 'Sample PDF' : 'None');

  const [allowCopy, setAllowCopy] = useState(false);
  const [zoom, setZoom] = useState(100);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    __agentLog('H6','KindleWidget.tsx:uploadClick','upload click',{agentId, agentName});
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    __agentLog('H6','KindleWidget.tsx:fileSelected','pdf selected',{name: file.name, size: file.size, type: file.type, agentId, agentName});
    setPdfFile(file);
  };


  __agentLog('H6','KindleWidget.tsx:render','render kindle widget',{isFullScreen: !!isFullScreen, hasPdf: !!pdfFile, isPaid, currentPage, zoom, agentId, agentName});

  // Persist URL-based selection per agent (File uploads are session-only)
  try {
    if (agentId && typeof pdfFile === 'string') {
      const key = 'htoh_agent_pdf_map_v1';
      const raw = localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};
      map[agentId] = { url: pdfFile, updatedAt: Date.now(), agentName: agentName || '' };
      localStorage.setItem(key, JSON.stringify(map));
      __agentLog('H6','KindleWidget.tsx:persist','persist pdf url',{agentId, url: pdfFile});
    }
  } catch (e) {
    __agentLog('H6','KindleWidget.tsx:persistError','persist error',{message: String(e)});
  }


  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] relative">
      {/* Header - Hidden in fullscreen mode */}
      {!isFullScreen && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-sm text-white font-medium">PDF Viewer</div>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-all rounded-lg hover:bg-white/10"
              title="Search Document"
            >
              <Search size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            <button onClick={() => { __agentLog('H6','KindleWidget.tsx:useSample','use sample pdf',{agentId, agentName}); setPdfFile(SAMPLE_PDF_URL); }} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold" title="Use Sample PDF">Use Sample</button>
            <button onClick={handleUploadClick} className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold" title="Upload PDF">Upload</button>
            <button onClick={() => { __agentLog('H6','KindleWidget.tsx:clearPdf','clear pdf',{agentId, agentName}); setPdfFile(null); }} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold" title="Clear PDF">Clear</button>
            {onToggleFullScreen && (
              <button onClick={onToggleFullScreen} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white" title="Fullscreen">
                <Maximize2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white" title="Close">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* KindleViewer handles fullscreen Close + Search buttons internally */}
      <div className="flex-1 min-h-0 relative">
        <KindleViewer
          data={MOCK_BOOK_DATA}
          isPaid={isPaid}
          currentPage={currentPage}
          samplePages={samplePages}
          onPageChange={setCurrentPage}
          onSetPaid={setIsPaid}
          onShowVideo={() => { /* no-op in widget */ }}
          pdfFile={pdfFile}
          onUploadClick={handleUploadClick}
          isFullscreen={!!isFullScreen}
          onToggleFullscreen={onToggleFullScreen}
          allowCopy={allowCopy}
          zoom={zoom}
          onZoomChange={setZoom}
          isChatVisible={false}
          onOpenSearch={() => setIsSearchOpen(true)}
          onFileDrop={(file) => setPdfFile(file)}
        />
      </div>

      {/* Search Sidebar - Available in all modes including fullscreen */}
      <SearchSidebar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        data={MOCK_BOOK_DATA}
        onSelectPage={setCurrentPage}
        pdfFile={pdfFile}
        activeMode={AppMode.Viewer}
      />
    </div>
  );
}
