
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Maximize2, Calendar as CalendarIcon, X, Users } from 'lucide-react';
import { MesopField } from './FormsWidget';

interface CalendarWidgetProps {
  onExpand?: () => void;
  isExpanded?: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  location?: string;
  description?: string;
  parties?: string;
}

// Helper to create dates relative to today
const createDate = (daysAdd: number, hour: number, minute: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAdd);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// Initial Mock events
const INITIAL_EVENTS: CalendarEvent[] = [
  { 
    id: '1', 
    title: "Closing Strategy Call", 
    start: createDate(0, 10, 0), 
    end: createDate(0, 11, 0), 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    location: "Zoom",
    parties: "Alice Freeman, Bob Smith"
  },
  { 
    id: '2', 
    title: "Property Inspection", 
    start: createDate(0, 14, 0), 
    end: createDate(0, 15, 30), 
    color: "bg-orange-100 text-orange-800 border-orange-200",
    location: "123 Cherry Ln",
    parties: "Tom Wilson"
  },
  { 
    id: '3', 
    title: "Open House", 
    start: createDate(2, 11, 0), 
    end: createDate(2, 14, 0), 
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    location: "456 Oak St"
  },
  { 
    id: '4', 
    title: "Client Follow-up", 
    start: createDate(-1, 9, 30), 
    end: createDate(-1, 10, 0), 
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Discuss contract terms"
  },
];

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onExpand, isExpanded = false }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'Day' | 'Week' | 'Month'>('Month');
  
  // Selection State
  const [selectionStart, setSelectionStart] = useState<number | null>(null); // Hour index
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);     // Hour index
  const [isDragging, setIsDragging] = useState(false);
  
  // Add Event State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventParties, setNewEventParties] = useState("");
  const [isExpandedInput, setIsExpandedInput] = useState(false);

  // Interaction Refs
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const newEventFormRef = useRef<HTMLDivElement>(null);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // --- Date Helpers ---
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();

  // --- Handlers ---

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = new Date(currentDate);
    if (view === 'Month') newDate.setMonth(newDate.getMonth() - 1);
    else if (view === 'Week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = new Date(currentDate);
    if (view === 'Month') newDate.setMonth(newDate.getMonth() + 1);
    else if (view === 'Week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // --- Interaction Logic (Press & Hold, Double Click) ---

  const handleDateInteractionStart = (date: Date) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      triggerDayView(date);
    }, 500);
  };

  const triggerDayView = (date: Date) => {
      setCurrentDate(date);
      setSelectedDate(date);
      setView('Day');
      // Default selection for convenience
      setSelectionStart(9);
      setSelectionEnd(9);
      setIsExpandedInput(true);
      if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleDateInteractionEnd = (date: Date) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isLongPress.current) {
      setSelectedDate(date);
      if (view === 'Week') setCurrentDate(date); 
    }
    isLongPress.current = false;
  };

  // --- Drag Selection in Day View ---

  const handleSlotDown = (hour: number) => {
    setIsDragging(true);
    setSelectionStart(hour);
    setSelectionEnd(hour);
    setIsExpandedInput(true); 
  };

  const handleSlotEnter = (hour: number) => {
    if (isDragging && selectionStart !== null) {
      setSelectionEnd(hour);
    }
  };

  const handleSlotUp = () => {
    setIsDragging(false);
  };

  const saveNewEvent = () => {
    if (!newEventTitle.trim()) return;

    const startHour = selectionStart !== null ? Math.min(selectionStart, selectionEnd || selectionStart) : 9;
    const endHour = selectionStart !== null ? Math.max(selectionStart, selectionEnd || selectionStart) + 1 : 10;

    const start = new Date(selectedDate);
    start.setHours(startHour, 0, 0, 0);
    
    const end = new Date(selectedDate);
    end.setHours(endHour, 0, 0, 0);

    const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: newEventTitle,
        start,
        end,
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
        location: "New Location",
        parties: newEventParties
    };

    setEvents(prev => [...prev, newEvent]);
    setIsExpandedInput(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setNewEventTitle("");
    setNewEventParties("");
  };

  // Scroll effect when opening event form
  useEffect(() => {
    if (isExpandedInput && newEventFormRef.current) {
      setTimeout(() => {
        newEventFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [isExpandedInput]);

  // --- Renderers ---

  const renderMonthGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const padding = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
      return d;
    });

    const totalSlots = [...padding, ...days];
    // Fill remaining cells
    const remaining = 42 - totalSlots.length;
    const endPadding = Array(remaining).fill(null);
    const gridItems = [...totalSlots, ...endPadding];

    return (
      <div className="grid grid-cols-7 auto-rows-fr h-full bg-white">
        {gridItems.map((date, idx) => {
          if (!date) {
            return <div key={`pad-${idx}`} className={`border-b border-r border-gray-100 bg-gray-50/30 min-h-[60px] ${isExpanded ? 'min-h-[100px]' : ''}`} />;
          }
          
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const dayEvents = events.filter(e => isSameDay(e.start, date));
          
          return (
            <div 
              key={date.toISOString()}
              onMouseDown={() => handleDateInteractionStart(date)}
              onMouseUp={() => handleDateInteractionEnd(date)}
              onTouchStart={() => handleDateInteractionStart(date)}
              onTouchEnd={() => handleDateInteractionEnd(date)}
              onMouseLeave={() => { if(longPressTimer.current) clearTimeout(longPressTimer.current); }}
              onDoubleClick={(e) => { e.stopPropagation(); triggerDayView(date); }}
              className={`
                relative border-b border-r border-gray-100 p-1 flex flex-col items-center justify-start cursor-pointer transition-all select-none
                ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                ${isExpanded ? 'min-h-[100px]' : 'min-h-[60px]'}
              `}
            >
              <span className={`
                text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1
                ${isToday ? 'bg-[#141D84] text-white shadow-sm' : isSelected ? 'text-[#141D84] font-bold' : 'text-gray-700'}
              `}>
                {date.getDate()}
              </span>
              
              <div className="flex flex-col gap-0.5 w-full px-0.5">
                {dayEvents.slice(0, isExpanded ? 4 : 2).map((ev, k) => (
                  <div key={k} className={`
                    text-[9px] rounded-sm px-1 truncate w-full border-l-2
                    ${isExpanded ? 'py-0.5' : 'h-1.5'}
                    ${ev.color}
                  `}>
                    {isExpanded ? ev.title : ''}
                  </div>
                ))}
                {dayEvents.length > (isExpanded ? 4 : 2) && (
                   <div className="text-[8px] text-gray-400 text-center leading-none">+ more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekGrid = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="grid grid-cols-7 h-full bg-white divide-x divide-gray-100">
        {weekDates.map((date) => {
           const isSelected = isSameDay(date, selectedDate);
           const isToday = isSameDay(date, new Date());
           const dayEvents = events.filter(e => isSameDay(e.start, date));

           return (
             <div 
                key={date.toISOString()}
                onMouseDown={() => handleDateInteractionStart(date)}
                onMouseUp={() => handleDateInteractionEnd(date)}
                onTouchStart={() => handleDateInteractionStart(date)}
                onTouchEnd={() => handleDateInteractionEnd(date)}
                onMouseLeave={() => { if(longPressTimer.current) clearTimeout(longPressTimer.current); }}
                onDoubleClick={(e) => { e.stopPropagation(); triggerDayView(date); }}
                className={`flex flex-col h-full hover:bg-gray-50 transition-colors cursor-pointer select-none ${isSelected ? 'bg-blue-50/30' : ''}`}
             >
                <div className={`p-2 text-center border-b border-gray-100 ${isToday ? 'bg-[#141D84]/5' : ''}`}>
                   <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">{weekDays[date.getDay()]}</div>
                   <div className={`mx-auto w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-[#141D84] text-white' : 'text-gray-800'}`}>
                     {date.getDate()}
                   </div>
                </div>
                <div className="flex-1 p-1 space-y-1 overflow-y-auto no-scrollbar relative">
                   {Array.from({length: 12}).map((_, i) => (
                      <div key={i} className="absolute w-full border-t border-dashed border-gray-100 h-10" style={{ top: i * 40 }}></div>
                   ))}
                   
                   {dayEvents.map((ev, k) => (
                      <div key={k} className={`text-[9px] p-1 rounded border-l-2 mb-1 shadow-sm ${ev.color}`}>
                        <span className="font-bold block">{ev.start.getHours()}:00</span>
                        {ev.title}
                      </div>
                   ))}
                </div>
             </div>
           );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i); 
    const dayEvents = events.filter(e => isSameDay(e.start, selectedDate));

    return (
      <div className="flex flex-col h-full bg-white relative overflow-y-auto" onMouseUp={handleSlotUp} onMouseLeave={handleSlotUp}>
         {hours.map((hour) => {
            const isSelectedSlot = selectionStart !== null && selectionEnd !== null && 
                                   hour >= Math.min(selectionStart, selectionEnd) && 
                                   hour <= Math.max(selectionStart, selectionEnd);
            
            const hourEvents = dayEvents.filter(e => e.start.getHours() === hour);

            return (
              <div 
                key={hour} 
                className={`flex border-b border-gray-100 min-h-[50px] relative group select-none ${isSelectedSlot ? 'bg-indigo-50/60' : ''}`}
                onMouseDown={() => handleSlotDown(hour)}
                onMouseEnter={() => handleSlotEnter(hour)}
                onClick={() => { if (!isDragging) handleSlotDown(hour); }} // Simple click to select
              >
                 <div className="w-14 border-r border-gray-100 p-2 text-[10px] text-gray-400 text-right font-medium shrink-0 sticky left-0 bg-white z-10">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                 </div>
                 
                 <div className="flex-1 relative p-1">
                    {hourEvents.map((ev, k) => (
                       <div key={k} className={`absolute top-0 left-1 right-1 z-20 p-1.5 rounded-md border text-xs shadow-sm ${ev.color}`} style={{ height: '48px' }}>
                          <div className="flex justify-between">
                            <span className="font-bold truncate">{ev.title}</span>
                            <span className="opacity-75 text-[10px]">{ev.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          {ev.parties && <div className="text-[10px] opacity-80 truncate flex items-center gap-1 mt-0.5"><Users size={10}/> {ev.parties}</div>}
                       </div>
                    ))}
                    
                    {isSelectedSlot && (
                       <div className="absolute inset-0 bg-indigo-100/20 pointer-events-none flex items-center justify-center border-l-2 border-indigo-400">
                       </div>
                    )}
                 </div>
              </div>
            );
         })}
      </div>
    );
  };

  const selectedEvents = events.filter(e => isSameDay(e.start, selectedDate));
  const selectionText = selectionStart !== null && selectionEnd !== null 
     ? `${Math.min(selectionStart, selectionEnd)}:00 - ${Math.max(selectionStart, selectionEnd) + 1}:00` 
     : null;

  return (
    <div 
      className={`
        bg-white border-gray-200 overflow-hidden flex flex-col font-sans relative group transition-all duration-300
        ${isExpanded 
          ? 'h-full border-0 rounded-none w-full max-w-none' 
          : 'rounded-xl shadow-sm border mt-2 cursor-pointer w-full max-w-none min-w-[320px] md:min-w-[640px]'}
      `}
      onClick={!isExpanded && onExpand ? onExpand : undefined}
    >
        {/* --- Header Section --- */}
        <div className="flex flex-col border-b border-gray-100 bg-white z-20 shrink-0">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex gap-4">
                  {['Day', 'Week', 'Month'].map(v => (
                      <button 
                          key={v}
                          onClick={(e) => { e.stopPropagation(); setView(v as any); }}
                          className={`
                            pb-1 text-sm font-bold transition-all
                            ${view === v 
                              ? 'text-[#141D84] border-b-2 border-[#141D84]' 
                              : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'}
                          `}
                      >
                          {v}
                      </button>
                  ))}
                </div>
                <button 
                    className="text-[#141D84] font-bold text-[10px] uppercase tracking-wider bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors border border-blue-100"
                    onClick={handleToday}
                >
                    TODAY
                </button>
            </div>

            <div className="flex items-center justify-between px-3 py-2">
                 <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                    <ChevronLeft size={20} />
                 </button>
                 <div className="text-center">
                    <h2 className="text-lg font-serif font-bold text-slate-800 leading-tight">
                        {view === 'Day' 
                           ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                           : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        }
                    </h2>
                    {view === 'Week' && <span className="text-xs text-gray-400">Week of {new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay())).getDate()}</span>}
                 </div>
                 <div className="flex items-center">
                    <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                    {!isExpanded && onExpand && (
                         <button
                           onClick={(e) => { e.stopPropagation(); onExpand(); }}
                           className="p-2 rounded-full ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                           style={{ backgroundColor: 'rgba(20, 29, 132, 1)', color: '#F5F7FF' }}
                         >
                             <Maximize2 size={16} />
                         </button>
                    )}
                 </div>
            </div>
            
            {view === 'Month' && (
              <div className="grid grid-cols-7 text-center pb-2 border-b border-gray-50 bg-gray-50/50">
                  {weekDays.map((d) => (
                      <div key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1">{d.slice(0, 1)}</div>
                  ))}
              </div>
            )}
        </div>

        {/* --- Main View Area --- */}
        <div className="flex-1 overflow-y-auto bg-white relative">
             {view === 'Month' && renderMonthGrid()}
             {view === 'Week' && renderWeekGrid()}
             {view === 'Day' && renderDayView()}
        </div>
        
        {/* --- Event Entry & List --- */}
        <div className={`
           bg-gray-50 border-t border-gray-200 flex flex-col transition-all duration-300 relative
           ${isExpanded ? 'h-64' : 'h-auto max-h-64'}
        `} onClick={(e) => e.stopPropagation()}>
           
           <div className="px-4 py-2 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-10 h-10 shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                {selectedDate.toLocaleDateString()}
                {selectionText && (
                   <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold normal-case border border-indigo-100">
                     {selectionText}
                   </span>
                )}
              </span>
              <span className="text-[10px] text-gray-400">{selectedEvents.length} Events</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {selectedEvents.length === 0 && !isExpandedInput && (
                 <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                    <CalendarIcon size={20} className="mb-2 opacity-20" />
                    <span className="text-xs">No events scheduled</span>
                 </div>
              )}
              {selectedEvents.map(ev => (
                  <div key={ev.id} className="flex gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm items-start">
                     <div className={`w-1 self-stretch rounded-full ${ev.color.split(' ')[0]}`}></div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                           <h4 className="text-sm font-bold text-gray-800 truncate">{ev.title}</h4>
                           <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                             {ev.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                        {ev.parties && (
                           <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Users size={10} /> {ev.parties}
                           </div>
                        )}
                     </div>
                  </div>
                ))}
           </div>

           {/* Persistent Quick Add / Expanded Input with MESOP Style */}
           <div ref={newEventFormRef} className={`p-3 bg-white border-t border-indigo-100 transition-all duration-200 ${isExpandedInput ? 'pb-4' : 'pb-3'}`}>
              {isExpandedInput ? (
                 <div className="space-y-3 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#141D84]">New Event</span>
                        <button onClick={() => setIsExpandedInput(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                    </div>
                    
                    {/* MESOP Style Inputs */}
                    <div className="space-y-3">
                        <MesopField 
                          type="Text" 
                          label="Event Title (e.g. Inspection)" 
                          value={newEventTitle} 
                          onChange={setNewEventTitle} 
                          placeholder=""
                        />
                        <MesopField 
                          type="Text" 
                          label="Add Parties (e.g. Alice, Bob)" 
                          value={newEventParties} 
                          onChange={setNewEventParties} 
                          placeholder=""
                        />
                    </div>

                    <button onClick={saveNewEvent} disabled={!newEventTitle.trim()} className="w-full py-3 bg-[#8995e0] text-white text-sm font-bold rounded-md hover:bg-blue-900 disabled:opacity-50 mt-2 shadow-sm">
                       Add Event
                    </button>
                 </div>
              ) : (
                 <div className="flex items-center gap-2 cursor-text" onClick={() => setIsExpandedInput(true)}>
                    <div className="w-8 h-8 bg-[#141D84]/10 rounded-full flex items-center justify-center text-[#141D84]">
                       <Plus size={18} />
                    </div>
                    <span className="text-sm text-gray-400 flex-1">Add new event...</span>
                 </div>
              )}
           </div>
        </div>
    </div>
  );
};
