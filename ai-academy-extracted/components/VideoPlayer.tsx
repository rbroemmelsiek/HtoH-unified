
import React, { useState, useEffect } from 'react';

interface VideoPlayerProps {
  videoId: string; // This can be a full URL or an ID
  onClose: () => void;
  isShort?: boolean;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onClose, isShort, onEnded }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Robust YouTube ID extractor
  const getEmbedUrl = (input: string) => {
    if (!input) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = input.match(regExp);
    if (match && match[2].length === 11) {
      const id = match[2];
      // enablejsapi=1 is required for some postMessage behaviors
      return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1`;
    }
    return input;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // YouTube Embed API sends messages. We can detect when video ends.
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info && data.info.playerState === 0) {
          // playerState 0 is "ended"
          if (onEnded) onEnded();
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded]);

  const finalUrl = getEmbedUrl(videoId);

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-fade-in">
      <div className="absolute top-6 right-6 z-[310]">
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10 shadow-2xl"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      <div 
        className={`relative bg-black rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 transition-all duration-500 ${isShort ? 'h-[85vh] aspect-[9/16]' : 'w-full max-w-5xl aspect-video'}`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-blue-400 tracking-widest uppercase opacity-60">Summoning Lesson...</p>
            </div>
          </div>
        )}

        <iframe 
          id="ytplayer"
          src={finalUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          title="YouTube Video Player"
        ></iframe>
      </div>
    </div>
  );
};

export default VideoPlayer;
