import React, { useMemo } from 'react';
import { usePlan } from '../context/PlanContext';
import { XIcon } from './Icons';

const VideoModal: React.FC = () => {
  const { state, dispatch } = usePlan();
  const { isOpen, videoUrl } = state.videoModal;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_VIDEO' });
  };

  const { videoId, isPortrait } = useMemo(() => {
    if (!videoUrl) return { videoId: null, isPortrait: false };

    try {
      const u = new URL(videoUrl.trim());
      let id = null;
      let isShorts = false;

      // Handle standard youtube.com
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.startsWith('/shorts/')) {
          id = u.pathname.split('/')[2];
          isShorts = true;
        } else if (u.pathname.startsWith('/embed/')) {
          id = u.pathname.split('/')[2];
        } else if (u.pathname.startsWith('/v/')) {
          id = u.pathname.split('/')[2];
        } else if (u.searchParams.has('v')) {
          id = u.searchParams.get('v');
        }
      } 
      // Handle youtu.be
      else if (u.hostname === 'youtu.be') {
        // Pathname is /ID
        id = u.pathname.slice(1).split('/')[0];
      }

      return { videoId: id, isPortrait: isShorts };
    } catch (e) {
      // Fallback regex if URL parsing fails
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
      const match = videoUrl.match(regExp);
      const id = (match && match[2]) ? match[2] : null;
      const isShorts = videoUrl.includes('/shorts/');
      return { videoId: id, isPortrait: isShorts };
    }
  }, [videoUrl]);

  if (!isOpen || !videoUrl) return null;

  // Container Classes Logic
  // Landscape: Full width priority (max-w-5xl), 16:9 aspect
  // Portrait/Shorts: Full height priority (h-auto max-h-[85vh]), 9:16 aspect
  const containerClass = isPortrait 
    ? "h-full w-auto max-h-[85vh] aspect-[9/16]" 
    : "w-full max-w-5xl aspect-video";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className={`relative bg-black rounded-lg shadow-2xl flex flex-col items-center justify-center overflow-hidden ${containerClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          title="Close Video"
        >
          <XIcon className="w-6 h-6" />
        </button>

        {videoId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&origin=${window.location.origin}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="text-white p-8 text-center">
            <p className="text-lg font-bold">Error loading video</p>
            <p className="text-sm opacity-70">Could not extract YouTube ID from: {videoUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal;