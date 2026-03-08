
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { BookPageData } from '../types';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

interface KindleViewerProps {
  data: BookPageData[];
  isPaid: boolean;
  currentPage: number;
  samplePages: number[];
  onPageChange: (page: number) => void;
  onSetPaid: (paid: boolean) => void;
  onShowVideo: (url: string, isShort: boolean) => void;
  pdfFile: string | File | null;
  onUploadClick?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  allowCopy?: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isChatVisible?: boolean;
  onToggleChat?: () => void;
  onOpenSearch?: () => void;
  onFileDrop?: (file: File) => void;
}

const KindleViewer: React.FC<KindleViewerProps> = ({ 
  data, isPaid, currentPage, samplePages, onPageChange, onSetPaid, onShowVideo, pdfFile, onUploadClick, 
  isFullscreen, onToggleFullscreen, allowCopy, zoom, onZoomChange, isChatVisible, onToggleChat, onOpenSearch, onFileDrop
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [bookDimensions, setBookDimensions] = useState({ width: 1280, height: 720 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [lastTap, setLastTap] = useState(0);
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      // Use a consistent buffer to ensure the document never clips ("Expand to Fit")
      const buffer = window.innerWidth < 768 ? 20 : 40;
      const vWidth = containerRef.current.clientWidth - buffer;
      const vHeight = containerRef.current.clientHeight - buffer; 
      
      const ratio = 16 / 9;
      
      let targetWidth = vWidth;
      let targetHeight = targetWidth / ratio;
      
      // If the calculated height is more than the available height, 
      // we constrain by height instead (Contain Fit / Expand to Fit)
      if (targetHeight > vHeight) {
        targetHeight = vHeight;
        targetWidth = targetHeight * ratio;
      }
      
      setBookDimensions({ 
        width: Math.max(280, Math.floor(targetWidth)), 
        height: Math.max(160, Math.floor(targetHeight)) 
      });
    }
  }, [isFullscreen]);

  useEffect(() => {
    window.addEventListener('resize', updateSize);
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    updateSize();
    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, [updateSize]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);
  const handleNext = useCallback(() => { if (currentPage < numPages) onPageChange(currentPage + 1); }, [currentPage, numPages, onPageChange]);
  const handlePrev = useCallback(() => { if (currentPage > 1) onPageChange(currentPage - 1); }, [currentPage, onPageChange]);

  // Drag-and-drop upload support
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!onFileDrop) return;
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      onFileDrop(file);
    }
  }, [onFileDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (onFileDrop) e.preventDefault();
  }, [onFileDrop]);

  // Desktop Navigation: Keyboard and Scroll Wheel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onZoomChange(Math.min(250, zoom + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          onZoomChange(Math.max(50, zoom - 10));
          break;
        case 'Escape':
          if (isFullscreen && onToggleFullscreen) onToggleFullscreen();
          break;
      }
    };

    let lastScrollTime = 0;
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < 400) return;

      if (Math.abs(e.deltaY) > 20) {
        if (e.deltaY > 0) {
          handleNext();
        } else {
          handlePrev();
        }
        lastScrollTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleNext, handlePrev, zoom, onZoomChange, isFullscreen, onToggleFullscreen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      if (initialPinchDist === null) {
        setInitialPinchDist(dist);
      } else {
        const delta = dist / initialPinchDist;
        const newZoom = Math.min(250, Math.max(50, zoom * (delta > 1 ? 1.02 : 0.98)));
        onZoomChange(newZoom);
        setInitialPinchDist(dist);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (onToggleFullscreen) onToggleFullscreen();
    }
    setLastTap(now);
    setInitialPinchDist(null);

    if (touchStartX && touchEndX) {
      const distance = touchStartX - touchEndX;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      if (isLeftSwipe) handleNext();
      else if (isRightSwipe) handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const fileSource = useMemo(() => {
    if (!pdfFile) return null;
    if (pdfFile instanceof File) return URL.createObjectURL(pdfFile);
    return pdfFile;
  }, [pdfFile]);

  const isLocked = !isPaid && !samplePages.includes(currentPage);
  const currentPageData = data.find(p => p.pageNumber === currentPage);

  return (
    <div 
      className={`flex flex-col h-full relative ${isDarkMode ? 'bg-[#050508] text-white' : 'bg-[#e2e8f0] text-gray-900'} transition-colors duration-500 font-['Open_Sans'] overflow-hidden`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Fullscreen Controls - Close and Search buttons */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-[600] flex items-center gap-2 pointer-events-auto">
          {/* Search Button */}
          {onOpenSearch && (
            <button 
              onClick={onOpenSearch}
              className="w-12 h-12 rounded-full bg-white text-black border border-black/20 flex items-center justify-center shadow-2xl transition-all hover:bg-blue-100 hover:scale-110 active:scale-95"
              title="Search Document"
            >
              <i className="fas fa-search text-lg"></i>
            </button>
          )}
          {/* Close Button */}
          {onToggleFullscreen && (
            <button 
              onClick={onToggleFullscreen}
              className="w-12 h-12 rounded-full bg-white text-black border border-black/20 flex items-center justify-center shadow-2xl transition-all hover:bg-red-100 hover:scale-110 active:scale-95"
              title="Close Fullscreen"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          )}
        </div>
      )}

      {!isFullscreen && (
        <div className="flex-none flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl z-[100] relative min-h-[50px]">
          <div className="flex-1 flex items-center gap-3 md:gap-6 min-w-0 mr-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex-none w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <i className={`fas ${isDarkMode ? 'fa-sun text-yellow-500' : 'fa-moon text-white'} text-xs md:text-sm`}></i>
            </button>
            <div className="flex-none flex items-center gap-2 md:gap-3">
              {!isLocked && fileSource && (
                <div className="flex items-center gap-2 md:gap-5 bg-white/5 border border-white/10 px-3 py-1 md:px-4 md:py-1.5 rounded-xl shadow-inner">
                  <button onClick={() => onZoomChange(Math.max(50, zoom - 10))} className="text-white/40 hover:text-white">
                    <i className="fas fa-minus text-[8px] md:text-[10px]"></i>
                  </button>
                  <div className="flex items-center gap-2 md:gap-3">
                    <input 
                      type="range"
                      min="50"
                      max="250"
                      value={zoom}
                      onChange={(e) => onZoomChange(parseInt(e.target.value))}
                      className="w-16 sm:w-24 md:w-32 lg:w-48 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                    />
                    <span className="hidden xs:inline text-[8px] md:text-[9px] font-mono text-white/60 w-8 text-right">{Math.round(zoom)}%</span>
                  </div>
                  <button onClick={() => onZoomChange(Math.min(250, zoom + 10))} className="text-white/40 hover:text-white">
                    <i className="fas fa-plus text-[8px] md:text-[10px]"></i>
                  </button>
                </div>
              )}
              <button onClick={onToggleFullscreen} className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all bg-white/5 border border-white/10 text-white hover:bg-white/20">
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-[10px] md:text-xs`}></i>
              </button>
            </div>
            <div className="flex-1 min-w-0">
               <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/70 truncate">
                 {currentPageData?.title || "Ethics Guide"}
               </h2>
            </div>
          </div>
          <div className="flex-none flex items-center">
            <div className={`text-[7px] md:text-[8px] px-2 py-0.5 md:px-3 md:py-1 rounded-lg font-black tracking-widest ${isPaid ? 'bg-[#04cc08]/20 text-[#04cc08] border border-[#04cc08]/30' : 'bg-[#ff6600] text-white'}`}>
              {isPaid ? 'PRO' : 'FREE'}
            </div>
          </div>
        </div>
      )}

      <div 
        ref={containerRef} 
        className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center p-0 ${allowCopy ? '' : 'unselectable'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isDarkMode && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute inset-0 bg-[#020205]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-[#0000cc] rounded-full blur-[180px] opacity-[0.15]"></div>
          </div>
        )}

        {isLocked ? (
          <div className="m-auto text-center p-8 md:p-16 bg-[#0f172a]/95 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-3xl backdrop-blur-3xl max-w-[90%] md:max-w-lg z-[150] animate-page-entry">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-[#ff6600]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-8">
              <i className="fas fa-lock text-xl md:text-4xl text-[#ff6600]"></i>
            </div>
            <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-5 tracking-tight brand-title text-white">Pro Access Required</h2>
            <p className="text-[10px] md:text-sm opacity-60 mb-8 md:mb-10 leading-relaxed text-gray-400">Upgrade to unlock the full compliance handbook and professional tools.</p>
            <button onClick={() => onSetPaid(true)} className="w-full bg-[#ff6600] py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm tracking-[0.2em] hover:bg-[#e65c00] transition-all text-white">ACTIVATE COURSE</button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full h-full overflow-hidden relative">
            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
              <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }} className="transition-transform duration-300 ease-out z-10 flex flex-col items-center justify-center">
                {fileSource ? (
                  <Document
                    file={fileSource}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="p-20 text-center opacity-30 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse text-white">SYNCHRONIZING RESOURCE...</div>}
                  >
                    <div className="document-container relative animate-page-entry" style={{ width: bookDimensions.width, height: bookDimensions.height }}>
                      <Page 
                        key={`page_${currentPage}`}
                        pageNumber={currentPage} 
                        width={bookDimensions.width}
                        height={bookDimensions.height}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        loading={null}
                        className={allowCopy ? 'allow-select' : 'no-select'}
                      />
                      
                      {/* Navigation Hotspots - Smaller, hover-only, positioned separately */}
                      {!isFullscreen && (
                        <>
                          {/* Left Page Control - Smaller, hover-only */}
                          <div 
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 opacity-0 hover:opacity-100 group transition-opacity duration-200"
                            onClick={handlePrev}
                          >
                            <div className="w-10 h-10 rounded-full bg-black/70 text-white items-center justify-center shadow-lg border border-white/20 hover:bg-black/90 hover:scale-110 transition-all backdrop-blur-md flex cursor-pointer">
                              <i className="fas fa-chevron-left text-base mx-auto"></i>
                            </div>
                          </div>
                          {/* Right Page Control - Smaller, hover-only */}
                          <div 
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 opacity-0 hover:opacity-100 group transition-opacity duration-200"
                            onClick={handleNext}
                          >
                            <div className="w-10 h-10 rounded-full bg-black/70 text-white items-center justify-center shadow-lg border border-white/20 hover:bg-black/90 hover:scale-110 transition-all backdrop-blur-md flex cursor-pointer">
                              <i className="fas fa-chevron-right text-base mx-auto"></i>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </Document>
                ) : (
                  <div 
                    onClick={onUploadClick} 
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-[300px] h-[170px] md:w-[800px] md:h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-[2rem] bg-white/5 p-6 md:p-20 text-center cursor-pointer hover:bg-white/10 transition-all shadow-3xl"
                  >
                    <i className="fas fa-cloud-upload-alt text-3xl md:text-6xl text-white opacity-40 mb-6"></i>
                    <h3 className="text-lg md:text-3xl font-black mb-3 tracking-tighter text-white brand-title">Library Inactive</h3>
                    <p className="text-gray-500 text-[8px] md:text-xs uppercase font-black tracking-[0.3em]">Attach Compliance PDF</p>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Chat Summoner - Appears when chat is hidden */}
            {!isChatVisible && onToggleChat && (
              <button 
                onClick={onToggleChat}
                className={`absolute bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-[#1E29BE]/80 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-[0_0_30px_rgba(30,41,190,0.5)] transition-all hover:scale-110 active:scale-95 group animate-pulse-subtle ${isFullscreen ? 'opacity-0 hover:opacity-100 transition-opacity' : ''}`}
              >
                <i className="fas fa-comments text-xl group-hover:rotate-12 transition-transform"></i>
              </button>
            )}

            {/* Video Action Buttons - Reduced opacity to 20%, no blur */}
            {currentPageData && fileSource && !isLocked && (
              <div className={`flex-none mt-4 md:mt-2 flex flex-wrap justify-center gap-3 md:gap-8 z-[120] relative max-w-full px-4 mb-2 md:mb-1 ${isFullscreen ? 'opacity-0 hover:opacity-100 transition-opacity duration-300' : ''}`}>
                <button 
                  onClick={() => onShowVideo(currentPageData.youtubeUrl, false)} 
                  className="bg-zinc-900/20 border border-white/20 rounded-xl md:rounded-2xl px-4 py-2 md:px-8 md:py-4 flex flex-row items-center gap-2 md:gap-4 shadow-3xl transition-all hover:bg-zinc-800/40 hover:scale-105 group"
                  style={{ opacity: 0.2 }}
                >
                  <i className="fas fa-play text-white text-[10px] md:text-xs"></i>
                  <span className="text-[9px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] text-white">LEARN MORE</span>
                </button>
                <button 
                  onClick={() => onShowVideo(currentPageData.shortsUrl, true)} 
                  className="bg-zinc-900/20 border border-white/20 rounded-xl md:rounded-2xl px-4 py-2 md:px-8 md:py-4 flex flex-row items-center gap-2 md:gap-4 shadow-3xl transition-all hover:bg-zinc-800/40 hover:scale-105 group"
                  style={{ opacity: 0.2 }}
                >
                  <i className="fas fa-mobile-screen text-white text-[10px] md:text-xs"></i>
                  <span className="text-[9px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] text-white">REEL VIEW</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-none px-4 md:px-12 py-3 md:py-5 bg-black/95 border-t border-white/5 backdrop-blur-3xl z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3 md:gap-14">
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <div className="flex justify-between text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-60">
              <span>PG {currentPage} / {numPages}</span>
              <span>{Math.round((numPages > 0 ? currentPage / numPages : 0) * 100)}% MASTERY</span>
            </div>
            <div className="h-1 md:h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer relative shadow-inner" onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              onPageChange(Math.max(1, Math.ceil(pct * numPages)));
            }}>
              <div className="h-full bg-[#04cc08] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(4,204,8,0.5)]" style={{ width: `${(numPages > 0 ? currentPage / numPages : 0) * 100}%` }}></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button disabled={currentPage <= 1} onClick={handlePrev} className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-5 transition-all">
              <i className="fas fa-chevron-left text-[10px] md:text-base"></i>
            </button>
            <button disabled={currentPage >= numPages} onClick={handleNext} className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-5 transition-all">
              <i className="fas fa-chevron-right text-[10px] md:text-base"></i>
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default KindleViewer;
