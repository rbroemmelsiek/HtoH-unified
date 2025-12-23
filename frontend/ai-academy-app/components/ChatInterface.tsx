
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LessonDifficulty } from '../types';

interface ChatInterfaceProps {
  onSendMessage: (msg: string) => void;
  messages: ChatMessage[];
  isThinking: boolean;
  onTtsToggle: (enabled: boolean) => void;
  isLessonActive?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onSendMessage, messages, isThinking, onTtsToggle, isLessonActive 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => { setInputValue(event.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border-t md:border-t-0 md:border-l border-gray-800">
      <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar" ref={scrollRef}>
        <div className="space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl p-4 shadow-xl border ${
                m.role === 'user' 
                  ? 'bg-[#1E29BE] border-blue-400/30 text-white shadow-blue-900/20' 
                  : 'bg-[#1e293b] border-gray-800 text-gray-200 shadow-black/40'
              }`}>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1 flex justify-between items-center gap-4">
                  <span>{m.role === 'user' ? 'Student' : m.isLesson ? 'AI Tutor' : 'Advisor'}</span>
                  {m.role === 'assistant' && (
                    <button onClick={() => onTtsToggle(!ttsEnabled)} className="hover:text-blue-400 transition-colors">
                      <i className={`fas fa-volume-${ttsEnabled ? 'up' : 'mute'}`}></i>
                    </button>
                  )}
                </div>
                <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                {m.navHint && (
                  <div className="mt-3 text-[9px] md:text-[10px] font-black py-1.5 px-3 bg-black/40 rounded-lg inline-flex items-center gap-2 text-blue-400 border border-blue-400/20">
                    <i className="fas fa-book-open"></i> ARTICLE PG. {m.navHint}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-[#1e293b] border border-gray-800 rounded-2xl p-4 flex gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 bg-black/40 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3 bg-[#1e293b] rounded-2xl p-1.5 md:p-2 px-3 md:px-4 shadow-xl border border-gray-700/50 focus-within:border-blue-500/50 transition-all">
          <button 
            type="button" onClick={handleSpeech}
            className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-blue-400'}`}
          >
            <i className="fas fa-microphone"></i>
          </button>
          <input 
            type="text"
            className="flex-1 bg-transparent py-2 md:py-3 focus:outline-none text-xs md:text-sm placeholder:text-gray-500 text-white"
            placeholder={isLessonActive ? "Type your answer..." : "Ask Advisor..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!inputValue.trim()}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-[#1E29BE] text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <i className="fas fa-paper-plane text-xs md:text-sm"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
