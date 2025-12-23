
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Agent, ExpandedWidgetType, AppConfig } from '../types';
import { User, AlertCircle, Volume2, StopCircle, Loader2 } from 'lucide-react';
import { textToSpeech, TTSResult } from '../services/geminiService';
import { CalendarWidget } from './CalendarWidget';
import { MapsWidget } from './MapsWidget';
import { PlacesWidget } from './PlacesWidget';
import { YouTubeWidget } from './YouTubeWidget';
import { GraphWidget } from './GraphWidget';
import { FormsWidget } from './FormsWidget';
import { ContactsWidget } from './ContactsWidget';

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

interface MessageBubbleProps {
  message: Message;
  agent?: Agent | null;
  config?: AppConfig;
  onExpandWidget?: (type: ExpandedWidgetType, data?: any) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, agent, config, onExpandWidget }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';
  const agentImage = agent?.imageUrl;

  // Extract widget tags
  const hasCalendarWidget = message.text.includes('[[WIDGET:Calendar]]');
  const hasMapsWidget = message.text.includes('[[WIDGET:Maps]]');
  const hasPlacesWidget = message.text.includes('[[WIDGET:Places]]');
  const hasYouTubeWidget = message.text.includes('[[WIDGET:YouTube]]');
  const hasGraphWidget = message.text.includes('[[WIDGET:Graph]]');
  const hasFormsWidget = message.text.includes('[[WIDGET:Forms]]');
  const hasContactsWidget = message.text.includes('[[WIDGET:Contacts]]');
  const hasPlanWidget = message.text.includes('[[WIDGET:Plan]]');
  const hasAcademyWidget = message.text.includes('[[WIDGET:Academy]]');
  const hasPdfViewerWidget = message.text.includes('[[WIDGET:PDFViewer]]') || message.text.includes('[[WIDGET:Kindle]]');
  
  const hasWidget = hasCalendarWidget || hasMapsWidget || hasPlacesWidget || hasYouTubeWidget || hasGraphWidget || hasFormsWidget || hasContactsWidget || hasPlanWidget || hasAcademyWidget || hasPdfViewerWidget;

  // Clean text for display
  let displayText = message.text
    .replace('[[WIDGET:Calendar]]', '')
    .replace('[[WIDGET:Maps]]', '')
    .replace('[[WIDGET:Places]]', '')
    .replace('[[WIDGET:YouTube]]', '')
    .replace('[[WIDGET:Graph]]', '')
    .replace('[[WIDGET:Forms]]', '')
    .replace('[[WIDGET:Contacts]]', '')
    .replace('[[WIDGET:Plan]]', '')
    .replace('[[WIDGET:Academy]]', '')
    .replace('[[WIDGET:PDFViewer]]', '')
    .replace('[[WIDGET:Kindle]]', '');

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioSource) audioSource.stop();
      if (audioContext && audioContext.state !== "closed") {
        try {
          audioContext.close();
        } catch {
          /* no-op */
        }
      }
      if (audioElement) {
        audioElement.pause();
        if (audioElement.src.startsWith("blob:")) {
          URL.revokeObjectURL(audioElement.src);
        }
      }
    };
  }, [audioSource, audioContext, audioElement]);

  const detectMime = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const str4 = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    // MP3 magic numbers: ID3 or 0xFF 0xFB
    if (str4 === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
      return "audio/mpeg";
    }
    if (str4 === "OggS") return "audio/ogg";
    if (str4 === "fLaC") return "audio/flac";
    if (str4 === "RIFF") return "audio/wav";
    return "audio/mpeg"; // default guess
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      if (audioSource) audioSource.stop();
      if (audioElement) {
        audioElement.pause();
        if (audioElement.src.startsWith("blob:")) {
          URL.revokeObjectURL(audioElement.src);
        }
        setAudioElement(null);
      }
      setIsPlaying(false);
      return;
    }

    setIsLoadingAudio(true);

    try {
      const tts: TTSResult | null = await textToSpeech(displayText, agent?.voiceName || 'Puck');
      
      if (tts?.buffer) {
        const audioData = tts.buffer;
        if (audioData.byteLength === 0) {
          console.warn("[TTS] Audio buffer is empty");
          return;
        }
        // Use a clone for decode to avoid detaching the original buffer
        const decodeBuffer = audioData.slice(0);
        // Attempt Web Audio decode first
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          setAudioContext(ctx);
          
          const buffer = await ctx.decodeAudioData(decodeBuffer);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          
          source.onended = () => setIsPlaying(false);
          
          source.start(0);
          setAudioSource(source);
          setIsPlaying(true);
          return;
        } catch (decodeErr) {
          console.warn("[TTS] Web Audio decode failed, falling back to HTMLAudio", decodeErr);
        }

        // Fallback: play via HTMLAudioElement + Blob
        const mime = tts.mime || detectMime(audioData);
        const url = tts.base64
          ? `data:${mime};base64,${tts.base64}`
          : URL.createObjectURL(new Blob([new Uint8Array(audioData)], { type: mime }));
        const el = new Audio(url);
        el.onended = () => {
          setIsPlaying(false);
          if (!tts.base64 && url.startsWith("blob:")) URL.revokeObjectURL(url);
          setAudioElement(null);
        };
        el.onerror = (err) => {
          console.error("[TTS] HTMLAudio playback failed", err);
          setIsPlaying(false);
          if (!tts.base64 && url.startsWith("blob:")) URL.revokeObjectURL(url);
          setAudioElement(null);
        };
        const playPromise = el.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch((err) => {
            console.error("[TTS] HTMLAudio play() rejected", err);
            setIsPlaying(false);
            if (!tts.base64 && url.startsWith("blob:")) URL.revokeObjectURL(url);
            setAudioElement(null);
          });
        }
        setAudioElement(el);
        setIsPlaying(true);
      } else {
        console.warn('[TTS] No audio data returned for message bubble');
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const renderAvatar = () => {
    if (isUser) {
      return (
        <div className="bg-[#141D84] w-full h-full flex items-center justify-center text-white">
          <User size={18} />
        </div>
      );
    }
    
    if (agentImage) {
      return (
        <img 
          src={agentImage} 
          alt={agent?.name || "Agent"} 
          className="w-full h-full object-cover"
        />
      );
    }
    
    return (
      <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500">
         <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      </div>
    );
  };

  const bubbleBaseClasses = "rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden relative max-w-full";
  
  // Standard Bubble Styles (No Widget)
  const standardBubbleStyle = isUser
    ? 'bg-[#141D84] text-white rounded-tr-none px-5 py-3 shadow-md prose-invert [&_p]:text-white [&_li]:text-white'
    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none px-5 py-3 prose-neutral text-gray-800';

  // Text-only part style when Widget is present (matches standard Agent bubble)
  const widgetTextPartStyle = 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm mb-2 prose-neutral text-gray-800';

  return (
    <div 
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in group`}
      style={{ color: 'rgba(249, 250, 251, 1)' }}
    >
      <div className={`flex max-w-full ${isUser ? 'flex-row-reverse gap-2' : 'flex-row gap-2'} md:gap-3`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden shadow-sm mt-1 border-2 border-white ring-1 ring-gray-100 transition-transform duration-200 group-hover:scale-105
        `}>
          {renderAvatar()}
        </div>

        {/* Bubble & Controls Container */}
        <div className={`
          flex flex-col
          ${isUser ? 'items-end' : 'items-start'}
          ${hasWidget ? 'w-full min-w-0' : ''} 
        `}>
          {/* Agent Name Header */}
          {!isUser && agent && (
            <div className="flex items-center justify-between w-full mb-1 ml-1">
               <span className="text-xs font-bold text-gray-500">
                {agent.name} <span className="font-normal opacity-75">• {agent.role}</span>
              </span>
            </div>
          )}

          {/* Message Content */}
          <div className={`
            ${bubbleBaseClasses}
            ${hasWidget ? 'p-0 bg-transparent border-none shadow-none w-full' : standardBubbleStyle}
            ${message.isError ? 'bg-red-50 border-red-200 text-red-800 px-5 py-3' : ''}
          `}>
             {message.isError ? (
               <div className="flex items-center gap-2">
                 <AlertCircle size={16} />
                 <span>{message.text}</span>
               </div>
             ) : (
               /* If widget exists, wrap text in its own bubble. If not, text sits in main container. */
               <div className={`
                  markdown prose prose-sm max-w-none break-words 
                  ${hasWidget && displayText.trim() ? widgetTextPartStyle : ''}
               `}>
                 <ReactMarkdown>{displayText}</ReactMarkdown>
               </div>
             )}
             
             {/* Widget Rendering - Rendered outside the text bubble styling */}
             {hasCalendarWidget && !isUser && (
               <div className="w-full">
                 <CalendarWidget onExpand={() => onExpandWidget && onExpandWidget('calendar')} />
               </div>
             )}
             {hasMapsWidget && !isUser && (
               <div className="w-full">
                 <MapsWidget onExpand={() => onExpandWidget && onExpandWidget('maps')} />
               </div>
             )}
             {hasPlacesWidget && !isUser && (
               <div className="w-full">
                 <PlacesWidget onExpand={() => onExpandWidget && onExpandWidget('places')} />
               </div>
             )}
             {hasYouTubeWidget && !isUser && (
               <div className="w-full">
                 <YouTubeWidget onExpand={() => onExpandWidget && onExpandWidget('youtube')} />
               </div>
             )}
             {hasGraphWidget && !isUser && (
                <div className="w-full">
                  <GraphWidget onExpand={() => onExpandWidget && onExpandWidget('graph')} />
                </div>
             )}
             {hasFormsWidget && !isUser && (
                <div className="w-full">
                  <FormsWidget onExpand={() => onExpandWidget && onExpandWidget('forms')} corpusData={config?.corpusData} />
                </div>
             )}
             {hasContactsWidget && !isUser && (
                <div className="w-full">
                  <ContactsWidget 
                    onExpand={(id) => onExpandWidget && onExpandWidget('contacts', id)} 
                    tableDef={config?.tableDefinitions.find(t => t.id === 'contacts')}
                  />
                </div>
             )}
             {hasPlanWidget && !isUser && (
                <div className="w-full mt-2">
                  <button
                    onClick={() => onExpandWidget && onExpandWidget('plan')}
                    className="w-full bg-gradient-to-r from-[#5972d0] to-[#141D84] text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:scale-[1.01] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Service Plan</div>
                        <div className="text-xs text-white/70">Click to view and edit your plan</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
             )}
          </div>

          {/* Footer: Timestamp, Audio */}
          <div className={`
            flex items-center gap-2 mt-1 px-1
            ${isUser ? 'flex-row-reverse' : 'flex-row'}
          `}>
             <span className="text-[10px] text-gray-400">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {!isUser && !message.isError && (
              <>
                {/* Audio Control */}
                <button 
                  onClick={handlePlayAudio}
                  disabled={isLoadingAudio}
                  className="ml-2 text-gray-400 hover:text-[#141D84] transition-colors p-1 rounded-full hover:bg-[#F0F4FA]"
                  title="Read aloud"
                >
                  {isLoadingAudio ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isPlaying ? (
                    <StopCircle size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}
                </button>
              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
