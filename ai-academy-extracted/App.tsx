
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import KindleViewer from './components/KindleViewer';
import ChatInterface from './components/ChatInterface';
import DataTable from './components/DataTable';
import VideoPlayer from './components/VideoPlayer';
import ConfigSidebar from './components/ConfigSidebar';
import SearchSidebar from './components/SearchSidebar';
import MeetingRoom from './components/MeetingRoom';
import { MOCK_BOOK_DATA, INITIAL_SAMPLE_RANGE, DEFAULT_PDF_URL } from './constants';
import { AppMode, ChatMessage, BookPageData, AutoplayMode, LessonState, LessonDifficulty, LiveSession } from './types';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.Viewer);
  const [isPaid, setIsPaid] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookData, setBookData] = useState<BookPageData[]>(MOCK_BOOK_DATA);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isLessonDeckOpen, setIsLessonDeckOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<string | File | null>(DEFAULT_PDF_URL);
  const [allowCopy, setAllowCopy] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  
  // Track window size for responsive logic
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Smart Zoom & Layout State
  const [zoom, setZoom] = useState(100);
  const [chatWidth, setChatWidth] = useState(450);
  const [chatHeight, setChatHeight] = useState(350); 
  const [lastChatWidth, setLastChatWidth] = useState(450);
  const [lastChatHeight, setLastChatHeight] = useState(350);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isFullscreenDoc, setIsFullscreenDoc] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const [sampleRangeRaw, setSampleRangeRaw] = useState(INITIAL_SAMPLE_RANGE);
  const [activeLiveSession, setActiveLiveSession] = useState<LiveSession | null>(null);
  const [profile, setProfile] = useState({ name: 'Alex Advisor', firm: 'HomeToHome Realty', email: 'alex@htoh.ai' });
  const [lesson, setLesson] = useState<LessonState>({ isActive: false, difficulty: null, currentStep: 0, score: 0 });

  // baseViewerWidth tracks the reference width for 100% zoom
  const baseViewerWidth = useRef(window.innerWidth - 450);

  // Update layout reference on window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      // Update the baseline reference for zoom calculations
      if (window.innerWidth >= 768) {
        baseViewerWidth.current = window.innerWidth - (isChatVisible ? chatWidth : 0);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chatWidth, isChatVisible]);

  // Adjust chatWidth if zoom changes manually (Smart Zoom Sync)
  useEffect(() => {
    if (!isChatVisible || isFullscreenDoc || isResizing || windowSize.width < 768) return;

    const currentViewerWidth = windowSize.width - chatWidth;
    const requiredViewerWidth = baseViewerWidth.current * (zoom / 100);

    if (Math.abs(requiredViewerWidth - currentViewerWidth) > 5) {
      const targetChatWidth = windowSize.width - requiredViewerWidth;
      const constrainedWidth = Math.max(200, Math.min(targetChatWidth, windowSize.width * 0.7));
      if (Math.abs(constrainedWidth - chatWidth) > 1) {
        setChatWidth(constrainedWidth);
      }
    }
  }, [zoom, isChatVisible, isFullscreenDoc, isResizing, windowSize.width]);

  const parseRange = useCallback((rangeStr: string): number[] => {
    const pages: number[] = [];
    const parts = rangeStr.split(',');
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(p => parseInt(p.trim()));
        if (!isNaN(start) && !isNaN(end)) for (let i = start; i <= end; i++) pages.push(i);
      } else {
        const p = parseInt(trimmed);
        if (!isNaN(p)) pages.push(p);
      }
    });
    return pages;
  }, []);

  const [samplePages, setSamplePages] = useState<number[]>(() => parseRange(INITIAL_SAMPLE_RANGE));
  const [autoplayMode, setAutoplayMode] = useState<AutoplayMode>(AutoplayMode.None);
  const [autoplayTimer, setAutoplayTimer] = useState<number | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: "Welcome back! I'm your Ai Ethics Tutor. Tap the graduate icon for lessons or browse our 'Ai Courses' catalog.", timestamp: Date.now() }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [videoOverlay, setVideoOverlay] = useState<{ url: string, isShort: boolean } | null>(null);

  const isResizingRef = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isChatVisible) {
      isResizingRef.current = true;
      setIsResizing(true);
      document.body.style.cursor = window.innerWidth < 768 ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    }
  }, [isChatVisible]);
  
  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);
  
  const handleDrag = useCallback((clientX: number, clientY: number) => {
    if (!isResizingRef.current) return;
    
    if (window.innerWidth >= 768) {
      const targetChatWidth = window.innerWidth - clientX;
      const maxChatWidth = window.innerWidth * 0.7;
      const minChatWidth = 100;
      
      if (targetChatWidth >= minChatWidth && targetChatWidth < maxChatWidth) {
        setChatWidth(targetChatWidth);
        setLastChatWidth(targetChatWidth);

        // Smart Zoom: Calculate zoom based on new viewer area vs baseline
        const currentViewerWidth = window.innerWidth - targetChatWidth;
        const newZoom = (currentViewerWidth / baseViewerWidth.current) * 100;
        setZoom(Math.min(250, Math.max(50, newZoom)));
      }
    } else {
      const targetChatHeight = window.innerHeight - clientY;
      const maxChatHeight = window.innerHeight * 0.8;
      const minChatHeight = 150;
      
      if (targetChatHeight >= minChatHeight && targetChatHeight < maxChatHeight) {
        setChatHeight(targetChatHeight);
        setLastChatHeight(targetChatHeight);
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDrag(e.clientX, e.clientY);
  }, [handleDrag]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleDrag(e.touches[0].clientX, e.touches[0].clientY);
      if (isResizingRef.current) e.preventDefault();
    }
  }, [handleDrag]);

  const toggleChat = useCallback(() => {
    if (window.innerWidth >= 768) {
      if (isChatVisible) {
        setLastChatWidth(chatWidth);
        setChatWidth(0);
        setIsChatVisible(false);
      } else {
        setChatWidth(lastChatWidth || 450);
        setIsChatVisible(true);
      }
    } else {
      if (isChatVisible) {
        setLastChatHeight(chatHeight);
        setChatHeight(0);
        setIsChatVisible(false);
      } else {
        setChatHeight(lastChatHeight || 350);
        setIsChatVisible(true);
      }
    }
  }, [isChatVisible, chatWidth, lastChatWidth, chatHeight, lastChatHeight]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', stopResizing);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [handleMouseMove, stopResizing, handleTouchMove]);

  useEffect(() => { setSamplePages(parseRange(sampleRangeRaw)); }, [sampleRangeRaw, parseRange]);

  const isLocked = !isPaid && !samplePages.includes(currentPage);

  useEffect(() => {
    if (autoplayMode === AutoplayMode.None) { setAutoplayTimer(null); return; }
    const pageData = bookData.find(p => p.pageNumber === currentPage);
    if (!pageData) return;
    setAutoplayTimer(4);
    const interval = setInterval(() => {
      setAutoplayTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setVideoOverlay({ url: pageData.youtubeUrl, isShort: false });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPage, autoplayMode, bookData]);

  const handleVideoEnd = () => {
    setVideoOverlay(null);
    if (autoplayMode === AutoplayMode.Continuous) {
      setCurrentPage(prev => Math.min(prev + 1, bookData.length));
    } else if (autoplayMode === AutoplayMode.Single) {
      setAutoplayMode(AutoplayMode.None);
    }
  };

  const gemini = useMemo(() => new GeminiService(process.env.API_KEY || "", bookData), [bookData]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await gemini.getChatResponse(text, currentPage, history, lesson.isActive, lesson.difficulty);
      
      const assistantMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response.text || "Compliance advisor online.", 
        timestamp: Date.now(),
        navHint: response.navHint,
        isLesson: lesson.isActive
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      if (response.navHint) {
        setCurrentPage(response.navHint);
        setActiveMode(AppMode.Viewer);
      }
      if (lesson.isActive && response.isCorrect !== undefined) {
        setLesson(prev => ({ ...prev, currentStep: prev.currentStep + 1, score: response.isCorrect ? prev.score + 10 : prev.score }));
      }
    } catch (e) { console.error(e); } finally { setIsThinking(false); }
  };

  const startLesson = (diff: LessonDifficulty) => {
    setLesson({ isActive: true, difficulty: diff, currentStep: 1, score: 0 });
    setIsLessonDeckOpen(false);
    handleSendMessage(`I'd like to start a ${diff} lesson about the Code of Ethics.`);
  };

  const quitLesson = () => setLesson({ isActive: false, difficulty: null, currentStep: 0, score: 0 });

  const isCurrentPageBookmarked = bookmarks.includes(currentPage);

  const handleJoinLive = (session: LiveSession) => {
    setActiveLiveSession(session);
    setActiveMode(AppMode.LiveSession);
    setIsFullscreenDoc(true); 
  };

  const handleExitLive = () => {
    setActiveLiveSession(null);
    setActiveMode(AppMode.Data);
    setIsFullscreenDoc(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0f] font-['Open_Sans']">
      {!isFullscreenDoc && (
        <header className="flex-none bg-[#1a237e] flex items-center px-4 md:px-6 justify-between border-b border-white/10 z-50 shadow-2xl mobile-compact-header h-[70px] md:h-20">
          <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-11 md:h-11 bg-[#ff6600] rounded-xl flex items-center justify-center text-white shadow-xl transform rotate-3 flex-none"><i className="fas fa-home text-sm md:text-lg"></i></div>
              <div className="hidden sm:block overflow-hidden">
                <div className="text-sm md:text-xl font-bold text-white brand-title leading-none truncate">HomeToHome</div>
                <div className="text-[7px] md:text-[9px] text-white/50 uppercase tracking-[0.2em] font-black mt-1 truncate">Ai ACADEMY</div>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <button 
                onClick={() => setIsSearchPanelOpen(true)}
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-white/40 hover:text-white transition-all rounded-lg hover:bg-white/10"
              >
                <i className="fas fa-search text-xs md:text-sm"></i>
              </button>
              <button onClick={() => setActiveMode(AppMode.Viewer)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[9px] md:text-xs font-black uppercase tracking-widest transition-all ${activeMode === AppMode.Viewer ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white'}`}>Viewer</button>
              <button onClick={() => setActiveMode(AppMode.Data)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[9px] md:text-xs font-black uppercase tracking-widest transition-all ${activeMode === AppMode.Data ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white'}`}>Hub</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsLessonDeckOpen(!isLessonDeckOpen)}
                className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all ${isLessonDeckOpen ? 'bg-[#1E29BE] text-white shadow-2xl scale-105' : 'bg-white/5 text-white hover:bg-white/10'}`}
              >
                <i className="fas fa-user-graduate text-sm md:text-base"></i>
              </button>
            </div>

            <div className="hidden xl:flex items-center bg-black/40 rounded-full px-1 py-1 gap-1 border border-white/5">
               <button 
                 onClick={() => setAutoplayMode(AutoplayMode.None)} 
                 className={`text-[8px] font-black px-3 py-1.5 rounded-full transition-all ${autoplayMode === AutoplayMode.None ? 'bg-[#ff6600] text-white' : 'text-white/40 hover:text-white'}`}
               >OFF</button>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setIsPaid(!isPaid)} className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[8px] md:text-[10px] font-black tracking-widest transition-all ${isPaid ? 'bg-[#04cc08] text-white' : 'bg-[#ff6600] text-white shadow-xl'}`}>{isPaid ? 'PRO' : 'GET PRO'}</button>
              <button onClick={() => setIsConfigOpen(true)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all"><i className="fas fa-bars text-sm md:text-lg"></i></button>
            </div>
          </div>
        </header>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeMode === AppMode.Viewer && (
            <KindleViewer 
              data={bookData} isPaid={isPaid} currentPage={currentPage} samplePages={samplePages}
              onPageChange={setCurrentPage} onSetPaid={setIsPaid}
              onShowVideo={(url, isShort) => setVideoOverlay({ url, isShort })}
              pdfFile={pdfFile} onUploadClick={() => setIsConfigOpen(true)}
              isFullscreen={isFullscreenDoc} onToggleFullscreen={() => setIsFullscreenDoc(!isFullscreenDoc)}
              allowCopy={allowCopy}
              zoom={zoom} onZoomChange={setZoom}
              isChatVisible={isChatVisible} onToggleChat={toggleChat}
            />
          )}
          {activeMode === AppMode.Data && (
            <DataTable 
              data={bookData} 
              onSelectPage={(p) => { setCurrentPage(p); setActiveMode(AppMode.Viewer); }} 
              onJoinLive={handleJoinLive}
              isPaid={isPaid}
              onBuyCourse={() => setIsPaid(true)}
            />
          )}
          {activeMode === AppMode.LiveSession && activeLiveSession && (
            <MeetingRoom session={activeLiveSession} onExit={handleExitLive} />
          )}
          
          {activeMode === AppMode.Viewer && !isLocked && !isFullscreenDoc && (
            <button 
              onClick={() => {
                const next = bookmarks.includes(currentPage) ? bookmarks.filter(b => b !== currentPage) : [...bookmarks, currentPage].sort((a,b)=>a-b);
                setBookmarks(next);
              }}
              className={`absolute top-20 right-4 md:top-24 md:right-10 z-[120] px-4 py-2 md:px-6 md:py-2.5 bg-zinc-900/60 border border-white/20 rounded-xl flex flex-row items-center gap-2 transition-all shadow-2xl backdrop-blur-md active:scale-95 hover:bg-zinc-800/90 hover:border-blue-400`}
            >
              <i className={`fas fa-bookmark text-[10px] md:text-xs ${isCurrentPageBookmarked ? 'text-[#04cc08]' : 'text-white'}`}></i>
              <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase text-white">SAVE</span>
            </button>
          )}
        </div>
        
        {!isFullscreenDoc && (
          <>
            {/* The Resizer Handle */}
            <div 
              className={`flex items-center justify-center resizer ${isResizing ? 'dragging' : ''} ${windowSize.width < 768 ? 'resizer-h' : 'resizer-v'}`} 
              onMouseDown={startResizing}
              onTouchStart={startResizing}
            >
              <button 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); toggleChat(); }}
                className={`flex items-center justify-center bg-zinc-900/80 border border-white/20 rounded-xl text-white shadow-2xl transition-all z-[170] active:scale-95 group hover:bg-zinc-800 hover:backdrop-blur-md hover:border-blue-400 ${
                  windowSize.width < 768 ? 'w-14 h-8 translate-y-2' : 'w-10 h-14 -ml-12 mr-4'
                }`}
              >
                <i className={`fas fa-caret-${
                  windowSize.width < 768 
                    ? (isChatVisible ? 'down' : 'up')
                    : (isChatVisible ? 'right' : 'left')
                } text-white text-lg`}></i>
              </button>
            </div>

            <div 
              style={{ 
                width: windowSize.width < 768 ? '100%' : (isChatVisible ? `${chatWidth}px` : '0px'),
                height: windowSize.width < 768 ? (isChatVisible ? `${chatHeight}px` : '0px') : '100%'
              }} 
              className={`flex-none border-t md:border-t-0 md:border-l border-white/10 bg-[#0a0a0f] backdrop-blur-3xl transition-all duration-300 ease-in-out overflow-hidden relative`}
            >
              <ChatInterface 
                messages={messages} onSendMessage={handleSendMessage} 
                isThinking={isThinking} onTtsToggle={() => {}} 
                isLessonActive={lesson.isActive}
              />
            </div>
          </>
        )}
      </div>

      {videoOverlay && <VideoPlayer videoId={videoOverlay.url} isShort={videoOverlay.isShort} onClose={() => setVideoOverlay(null)} onEnded={handleVideoEnd} />}

      <ConfigSidebar 
        isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)}
        onUpdateData={setBookData} onUpdateSamplePages={setSamplePages}
        onSetPdfFile={setPdfFile} appTitle="HomeToHome" agentAvatar=""
        sampleRangeRaw={sampleRangeRaw} onUpdateSampleRangeRaw={setSampleRangeRaw}
        currentData={bookData} allowCopy={allowCopy} onSetAllowCopy={setAllowCopy}
        bookmarks={bookmarks} onSelectBookmark={(p) => { setCurrentPage(p); setIsConfigOpen(false); }}
        profile={profile} onUpdateProfile={setProfile}
      />

      <SearchSidebar 
        isOpen={isSearchPanelOpen} 
        onClose={() => setIsSearchPanelOpen(false)}
        data={bookData}
        onSelectPage={setCurrentPage}
        pdfFile={pdfFile}
        activeMode={activeMode}
      />
    </div>
  );
};

export default App;
