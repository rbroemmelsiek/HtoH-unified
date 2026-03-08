
import React from 'react';
import { LiveSession } from '../types';

interface MeetingRoomProps {
  session: LiveSession;
  onExit: () => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ session, onExit }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#050508] overflow-hidden animate-page-entry relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a237e] via-[#ff6600] to-[#1a237e]"></div>
      
      {/* Header */}
      <div className="px-6 py-4 bg-black/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl text-white brand-title">{session.title}</h2>
              <span className="bg-red-600/20 text-red-500 text-[8px] font-black px-2 py-1 rounded-md border border-red-500/30 uppercase tracking-widest animate-pulse">LIVE SESSION</span>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Instructor: {session.instructor}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3 mr-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white shadow-xl">
                <i className="fas fa-user text-[10px]"></i>
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-black bg-[#1a237e] flex items-center justify-center text-[8px] font-black text-white shadow-xl">
              +42
            </div>
          </div>
          <button className="bg-[#ff6600] text-white text-[10px] font-black px-6 py-2.5 rounded-xl tracking-widest uppercase hover:bg-[#e65c00] transition-all shadow-lg shadow-orange-900/20">
            INVITE TEAM
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content: Google Meet Iframe */}
        <div className="flex-1 p-6 relative">
          <div className="w-full h-full bg-black rounded-3xl border border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
            {/* Real Google Meet Iframe Integration */}
            <iframe 
              src={`${session.meetUrl}?authuser=0&hl=en`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
              title="In-App Learning Session"
            ></iframe>
          </div>
        </div>

        {/* AI Companion Sidebar */}
        <div className="w-[380px] border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col">
          <div className="p-6 border-b border-white/5 bg-gradient-to-b from-[#1a237e]/10 to-transparent">
            <h3 className="text-white font-bold brand-title mb-1 flex items-center gap-3">
              <i className="fas fa-robot text-[#ff6600]"></i> Session Insights
            </h3>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Live Ai Ethics Monitor</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 leading-relaxed italic">
              "Fiduciary duty remains the cornerstone of this module. The Ai is currently cross-referencing Article 1 declarations for this specific scenario..."
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Referenced Articles</h4>
              <div className="space-y-2">
                {['Article 1: Loyalty', 'Article 12: Transparency'].map(art => (
                  <div key={art} className="flex items-center justify-between p-3 rounded-xl bg-[#1a237e]/10 border border-[#1a237e]/20 group hover:bg-[#1a237e]/20 transition-all cursor-pointer">
                    <span className="text-[10px] font-bold text-[#1E29BE]">{art}</span>
                    <i className="fas fa-arrow-right text-[10px] text-[#1E29BE] opacity-0 group-hover:opacity-100 transition-all"></i>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#ff6600]/10 to-transparent border border-[#ff6600]/20">
              <div className="flex items-center gap-3 mb-3">
                <i className="fas fa-lightbulb text-[#ff6600]"></i>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Discussion Topic</span>
              </div>
              <p className="text-xs font-bold text-gray-200">How does AI automation impact Article 2 disclosure requirements in your region?</p>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-black/40">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Ask AI Counselor privately..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#1E29BE] transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E29BE] hover:text-white">
                <i className="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
