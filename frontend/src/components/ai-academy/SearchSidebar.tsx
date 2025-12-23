
import React, { useState, useMemo, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { BookPageData, AppMode } from '../types';
import { ACADEMY_COURSES } from '../constants';

interface SearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: BookPageData[];
  onSelectPage: (page: number) => void;
  pdfFile: string | File | null;
  activeMode: AppMode;
  onNavigateToCourse?: (courseId: number) => void;
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({ 
  isOpen, onClose, data, onSelectPage, pdfFile, activeMode, onNavigateToCourse 
}) => {
  const [query, setQuery] = useState('');
  const [numPages, setNumPages] = useState<number>(0);

  const fileSource = useMemo(() => {
    if (!pdfFile) return null;
    if (pdfFile instanceof File) return URL.createObjectURL(pdfFile);
    return pdfFile;
  }, [pdfFile]);

  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    
    if (activeMode === AppMode.Viewer) {
      if (!q) {
        return { type: 'pages', items: Array.from({ length: numPages }, (_, i) => i + 1) };
      }
      const filtered = data
        .filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.content.toLowerCase().includes(q) ||
          p.keywords.some(k => k.toLowerCase().includes(q))
        )
        .map(p => p.pageNumber);
      return { type: 'pages', items: filtered };
    } else {
      if (!q) {
        return { type: 'courses', items: ACADEMY_COURSES };
      }
      const filtered = ACADEMY_COURSES.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q) || 
        c.badge.toLowerCase().includes(q)
      );
      return { type: 'courses', items: filtered };
    }
  }, [query, data, numPages, activeMode]);

  return (
    <div className={`fixed inset-0 z-[250] flex justify-start pointer-events-none transition-visibility duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-xl pointer-events-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      ></div>
      
      <div className={`relative w-full max-w-[350px] md:max-w-[420px] h-full bg-[#050508] border-r border-white/10 shadow-[50px_0_120px_rgba(0,0,0,0.9)] flex flex-col panel-transition pointer-events-auto transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-5 md:p-7 flex items-center gap-5 border-b border-white/5 bg-[#0a0a0f]/50">
          <div className="relative flex-1 group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors"></i>
            <input 
              autoFocus
              type="text"
              placeholder={activeMode === AppMode.Viewer ? "Search Document..." : "Search Catalog..."}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/10 transition-all placeholder:text-white/25"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex-none flex items-center justify-center text-white hover:bg-white/10 rounded-2xl transition-all shadow-lg active:scale-90"
          >
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#07070a] shadow-inner">
          {filteredResults.type === 'pages' ? (
            <div className="flex flex-col items-center gap-16">
              {fileSource ? (
                <Document
                  file={fileSource}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<div className="py-20 text-center text-[11px] font-black tracking-widest text-white/40 animate-pulse">OPTIMIZING VIEWPORT...</div>}
                >
                  {filteredResults.items.length > 0 ? (
                    (filteredResults.items as number[]).map((pageNo) => (
                      <div 
                        key={pageNo} 
                        className="flex flex-col items-center gap-5 group"
                      >
                        <div 
                          onClick={() => {
                            onSelectPage(pageNo);
                            onClose();
                          }}
                          className="relative cursor-pointer transition-all duration-500 transform hover:scale-[1.05] active:scale-95"
                        >
                          <div className="bg-white rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.7)] overflow-hidden border border-white/10 group-hover:border-white transition-colors">
                             <Page 
                               pageNumber={pageNo} 
                               width={290} 
                               renderTextLayer={false} 
                               renderAnnotationLayer={false}
                               loading={<div className="w-[290px] h-[163px] bg-white/5 animate-pulse" />}
                             />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                             <div className="bg-white text-black px-6 py-3 rounded-full text-[12px] font-black shadow-3xl uppercase tracking-tighter">
                                NAVIGATE TO PG {pageNo}
                             </div>
                          </div>
                        </div>
                        <div className="text-[12px] font-black tracking-[0.4em] text-white/40 group-hover:text-white transition-colors uppercase">
                          Page {pageNo}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-40 text-center space-y-5 opacity-40 text-white">
                      <i className="fas fa-search-minus text-5xl"></i>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em]">Zero Encounters</p>
                    </div>
                  )}
                </Document>
              ) : (
                <div className="py-40 text-center opacity-30 text-white">
                  <i className="fas fa-book-dead text-5xl mb-6"></i>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em]">Resource Unavailable</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em] mb-10 px-2">Academy Discoveries</h3>
              {filteredResults.items.length > 0 ? (
                (filteredResults.items as any[]).map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => {
                      if (onNavigateToCourse) onNavigateToCourse(course.id);
                      onClose();
                    }}
                    className="flex items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer group shadow-2xl"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-xl border border-white/5">
                      <i className={`fas ${course.icon} text-2xl`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate leading-tight mb-1.5">{course.title}</div>
                      <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">{course.badge} • {course.category}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-40 text-center space-y-5 opacity-40 text-white">
                  <i className="fas fa-graduation-cap text-5xl"></i>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em]">No Modules Found</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-8 bg-[#050508] border-t border-white/5 text-center">
          <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em]">
            {filteredResults.items.length} MATCHES
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchSidebar;
