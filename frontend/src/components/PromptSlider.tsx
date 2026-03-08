
import React, { useRef, useEffect } from 'react';
import { Suggestion } from '../types';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface PromptSliderProps {
  suggestions: Suggestion[];
  onSelect: (text: string) => void;
  isLoading: boolean;
}

export const PromptSlider: React.FC<PromptSliderProps> = ({ suggestions, onSelect, isLoading }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 300;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Reset scroll position when suggestions change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [suggestions]);

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="w-full relative group font-sans">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>

      {/* Left Gradient/Button */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#F0F4FA] to-transparent z-10 pointer-events-none flex items-center">
        <button 
          onClick={() => scroll('left')}
          className="pointer-events-auto bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm border border-[#141D84]/20 rounded-full p-1.5 ml-0 hidden group-hover:block transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} className="text-[#141D84]" />
        </button>
      </div>

      {/* Slider Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto no-scrollbar px-2 py-1.5 scroll-smooth items-center"
      >
        {isLoading ? (
          <div className="flex items-center gap-2 w-full animate-in fade-in duration-300">
            <div className="flex items-center text-[10px] font-semibold text-[#5D73CD] uppercase tracking-wider mr-1 flex-shrink-0 animate-pulse">
              <Sparkles size={12} className="mr-1" />
              Next
            </div>
            {/* Shimmer Boxes */}
            {[180, 140, 200, 160].map((width, i) => (
              <div 
                key={i}
                className="relative overflow-hidden bg-white rounded-lg h-7 border border-[#141D84]/10 flex-shrink-0 shadow-sm"
                style={{ width: `${width}px` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#141D84]/5 to-transparent animate-shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center text-[10px] font-semibold text-[#5D73CD] uppercase tracking-wider mr-1 flex-shrink-0">
              <Sparkles size={12} className="mr-1" />
              Next
            </div>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => onSelect(suggestion.text)}
                className="flex-shrink-0 bg-white hover:bg-[#141D84]/5 border border-gray-200 hover:border-[#141D84]/30 text-gray-600 hover:text-[#141D84] text-xs px-3 py-1.5 rounded-full transition-all duration-200 shadow-sm whitespace-nowrap"
              >
                {suggestion.text}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Right Gradient/Button */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F0F4FA] to-transparent z-10 pointer-events-none flex items-center justify-end">
        <button 
          onClick={() => scroll('right')}
          className="pointer-events-auto bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm border border-[#141D84]/20 rounded-full p-1.5 mr-0 hidden group-hover:block transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} className="text-[#141D84]" />
        </button>
      </div>
    </div>
  );
};
