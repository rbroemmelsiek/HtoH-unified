
import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { Agent } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AgentSelectorProps {
  agents: Agent[];
  currentAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ agents, currentAgent, onSelectAgent }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isClick, setIsClick] = useState(true); // Differentiate drag vs click
  
  // Persist mode for arrow buttons
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef<'left' | 'right' | null>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      // Add a small buffer (5px) to handle rounding errors
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => {
      // Delay to allow layout to settle after widget open/close or window resize
      setTimeout(() => {
        checkScroll();
        // Reset scroll to beginning if all elements should be visible
        if (scrollContainerRef.current) {
          const { scrollWidth, clientWidth } = scrollContainerRef.current;
          // If content fits, reset scroll position
          if (scrollWidth <= clientWidth) {
            scrollContainerRef.current.scrollLeft = 0;
          }
        }
      }, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [agents]);

  // --- Scroll Button Logic (Move One Card) ---
  const scrollOne = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      
      // Get the width of the first card to determine scroll distance
      // We assume cards are roughly similar size, or we take the average
      const firstCard = container.firstElementChild as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth : 200;
      const gap = 16; // w-4 gap is 1rem = 16px
      const scrollAmount = cardWidth + gap;

      const targetScroll = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;

      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
      
      // Re-check arrows after animation
      setTimeout(checkScroll, 350);
    }
  };

  // --- Persist Mode Logic ---
  const startScrolling = (direction: 'left' | 'right') => {
    // Clear any existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    
    // Initial scroll immediately
    scrollOne(direction);
    
    // Continue scrolling at regular intervals while held
    scrollIntervalRef.current = setInterval(() => {
      scrollOne(direction);
    }, 200); // Scroll every 200ms while held
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    isHoldingRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // --- Snap to Center Logic ---
  const centerAgentCard = (agentId: string) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const card = document.getElementById(`agent-card-${agentId}`);
      
      if (card) {
        // Calculate position to center the card
        // Desired ScrollLeft = CardLeft - (ContainerWidth/2) + (CardWidth/2)
        const cardLeft = card.offsetLeft;
        const cardWidth = card.offsetWidth;
        const containerWidth = container.clientWidth;
        
        const targetScrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);
        
        container.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleAgentClick = (agent: Agent) => {
    if (!isClick) return; // If we were dragging, don't select
    onSelectAgent(agent);
    centerAgentCard(agent.id);
  };

  // --- Mouse Drag Logic ---
  const handleMouseDown = (e: MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setIsClick(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiply for faster scroll speed (momentum feel)
    
    // If moved significantly, mark as drag (not click)
    if (Math.abs(x - startX) > 5) {
      setIsClick(false);
    }

    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    checkScroll();
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 relative group font-sans z-10">
      
      {/* Left Arrow */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/90 to-transparent z-20 flex items-center pl-2 transition-opacity duration-300 ${showLeftArrow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <button 
          onMouseDown={() => {
            isHoldingRef.current = 'left';
            startScrolling('left');
          }}
          onMouseUp={stopScrolling}
          onMouseLeave={stopScrolling}
          onClick={(e) => {
            // Prevent click if we were holding (persist mode)
            if (isHoldingRef.current !== 'left') {
              scrollOne('left');
            }
            e.preventDefault();
          }}
          className="bg-white border border-gray-200 shadow-sm rounded-full p-1.5 text-gray-500 hover:text-[#141D84] hover:border-[#141D84]/30 transition-all active:scale-95"
          aria-label="Scroll Left"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Right Arrow */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/90 to-transparent z-20 flex items-center justify-end pr-2 transition-opacity duration-300 ${showRightArrow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <button 
          onMouseDown={() => {
            isHoldingRef.current = 'right';
            startScrolling('right');
          }}
          onMouseUp={stopScrolling}
          onMouseLeave={stopScrolling}
          onClick={(e) => {
            // Prevent click if we were holding (persist mode)
            if (isHoldingRef.current !== 'right') {
              scrollOne('right');
            }
            e.preventDefault();
          }}
          className="bg-white border border-gray-200 shadow-sm rounded-full p-1.5 text-gray-500 hover:text-[#141D84] hover:border-[#141D84]/30 transition-all active:scale-95"
          aria-label="Scroll Right"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Slider Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`
          w-full px-4 flex items-center gap-4 overflow-x-auto no-scrollbar py-2 
          ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}
          snap-x snap-mandatory md:snap-none
        `}
      >
        {agents.map((agent) => {
          const isActive = currentAgent.id === agent.id;
          return (
            <button
              key={agent.id}
              id={`agent-card-${agent.id}`}
              onClick={() => handleAgentClick(agent)}
              className={`
                flex-shrink-0 relative flex items-center gap-3 px-3 py-1.5 rounded-xl border transition-all duration-300 group/agent select-none snap-center
                ${isActive 
                  ? 'bg-[#F0F4FA] border-[#141D84]/20 shadow-md ring-1 ring-[#141D84]/10 scale-100 z-0' 
                  : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-100 opacity-70 hover:opacity-100 grayscale hover:grayscale-0'
                }
              `}
              draggable={false} // Prevent native image dragging
            >
              {/* Avatar Image */}
              <div className="relative pointer-events-none">
                <div className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shadow-sm border-2 
                  ${isActive ? 'border-white ring-2 ring-[#141D84]/20' : 'border-transparent group-hover/agent:border-gray-200'}
                  transition-all duration-300
                `}>
                  <img 
                    src={agent.imageUrl} 
                    alt={agent.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                
                {/* Green Dot Indicator for Active State */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <div className="w-2.5 h-2.5 bg-[#04CC08] rounded-full border-2 border-white"></div>
                  </div>
                )}
              </div>
              
              <div className="text-left whitespace-nowrap pointer-events-none">
                <div className={`text-sm font-bold leading-tight ${isActive ? 'text-[#141D84]' : 'text-gray-500 group-hover/agent:text-gray-800'}`}>
                  {agent.name}
                </div>
                <div className="text-[10px] md:text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                  {agent.role}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
