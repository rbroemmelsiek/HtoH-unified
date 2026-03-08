
import React, { useState, useRef } from 'react';
import { BookPageData } from '../types';

interface ConfigSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateData: (newData: BookPageData[]) => void;
  onUpdateSamplePages: (pages: number[]) => void;
  onSetPdfFile: (file: File) => void;
  appTitle: string;
  agentAvatar: string;
  sampleRangeRaw: string;
  onUpdateSampleRangeRaw: (val: string) => void;
  currentData: BookPageData[];
  allowCopy: boolean;
  onSetAllowCopy: (val: boolean) => void;
  bookmarks?: number[];
  onSelectBookmark?: (page: number) => void;
  profile: { name: string, firm: string, email: string };
  onUpdateProfile: (val: any) => void;
}

const ConfigSidebar: React.FC<ConfigSidebarProps> = ({ 
  isOpen, onClose, onUpdateData, onUpdateSamplePages, 
  onSetPdfFile, appTitle, agentAvatar, sampleRangeRaw, onUpdateSampleRangeRaw,
  allowCopy, onSetAllowCopy, bookmarks = [], onSelectBookmark,
  profile, onUpdateProfile
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setIsProcessing(true);
      onSetPdfFile(file);
      setTimeout(() => { setIsProcessing(false); onClose(); }, 800);
    }
  };

  return (
    <div className={`fixed inset-0 z-[250] flex justify-end transition-visibility duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      ></div>
      <div className={`relative w-full max-w-[440px] h-full bg-[#0a0a0f] border-l border-white/5 shadow-2xl flex flex-col panel-transition transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-8 bg-[#1a237e] text-white flex flex-col gap-6 shadow-2xl">
          <div className="flex justify-between items-start">
             <div>
                <h2 className="text-3xl brand-title mb-1">Advisor Identity</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Credentials & Coursework</p>
             </div>
             <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all"><i className="fas fa-times"></i></button>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-3xl bg-[#ff6600] flex items-center justify-center text-white text-2xl shadow-xl transform -rotate-3"><i className="fas fa-user-tie"></i></div>
             <div>
                <div className="text-lg font-bold brand-title leading-tight">{profile.name}</div>
                <div className="text-[10px] font-black uppercase text-white/50 tracking-widest">{profile.firm}</div>
             </div>
          </div>
        </div>

        <div className="flex-1 p-8 space-y-10 overflow-y-auto custom-scrollbar bg-black/40">
          
          <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1E29BE] mb-4">Update Profile</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:border-[#1E29BE] outline-none transition-all"
                  value={profile.name}
                  onChange={(e) => onUpdateProfile({...profile, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Firm / Brokerage</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:border-[#1E29BE] outline-none transition-all"
                  value={profile.firm}
                  onChange={(e) => onUpdateProfile({...profile, firm: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Professional Email</label>
                <input 
                  type="email" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:border-[#1E29BE] outline-none transition-all"
                  value={profile.email}
                  onChange={(e) => onUpdateProfile({...profile, email: e.target.value})}
                />
              </div>
            </div>
          </section>

          <section className="bg-white/5 rounded-[2rem] border border-white/5 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6600] mb-6 flex items-center justify-between">
              <span>Saved Lessons</span>
              <i className="fas fa-bookmark"></i>
            </h3>
            {bookmarks.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {bookmarks.map(page => (
                  <button 
                    key={page}
                    onClick={() => onSelectBookmark && onSelectBookmark(page)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-[#ff6600] hover:bg-[#ff6600]/10 transition-all group"
                  >
                    <span className="text-[8px] text-gray-500 uppercase font-black group-hover:text-[#ff6600]">Pg</span>
                    <span className="text-base font-bold text-white group-hover:text-[#ff6600]">{page}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 opacity-30">
                 <i className="fas fa-folder-open text-2xl mb-3"></i>
                 <p className="text-[10px] uppercase font-black tracking-widest">Empty Library</p>
              </div>
            )}
          </section>

          <section className="bg-white/5 rounded-[2rem] border border-white/5 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1E29BE] mb-6">Security & Settings</h3>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-gray-400">Enable Article Export</span>
              <button 
                onClick={() => onSetAllowCopy(!allowCopy)}
                className={`w-14 h-7 rounded-full transition-all relative ${allowCopy ? 'bg-[#04cc08]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${allowCopy ? 'translate-x-7' : ''}`}></div>
              </button>
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Public Access Range</label>
               <input 
                type="text" 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-[#1E29BE] focus:ring-1 focus:ring-[#1E29BE] outline-none" 
                value={sampleRangeRaw}
                onChange={(e) => onUpdateSampleRangeRaw(e.target.value)}
              />
            </div>
          </section>

          <section className="bg-white/5 rounded-[2rem] border border-white/5 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff6600] mb-6">Course Injection</h3>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-[2rem] p-10 text-center cursor-pointer hover:bg-[#ff6600]/5 hover:border-[#ff6600]/30 transition-all group">
              {isProcessing ? <i className="fas fa-circle-notch fa-spin text-[#ff6600] text-3xl"></i> : <i className="fas fa-file-upload text-[#ff6600] text-4xl group-hover:scale-110 transition-transform"></i>}
              <p className="text-[10px] font-black mt-4 uppercase tracking-widest text-gray-500">Add Volume to Advisor</p>
              <p className="text-[9px] font-black mt-2 uppercase tracking-widest text-white/30">Click to upload a PDF</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ConfigSidebar;
