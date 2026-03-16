
import React, { useState, useEffect } from 'react';
import { ExpandedWidgetType, AppConfig } from '../types';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { MapsWidget } from './MapsWidget';
import { YouTubeWidget } from './YouTubeWidget';
import { CalendarWidget } from './CalendarWidget';
import { PlacesWidget } from './PlacesWidget';
import { GraphWidget } from './GraphWidget';
import { FormsWidget } from './FormsWidget';
import { ContactsWidget } from './ContactsWidget';
import { PlanWidget } from './PlanWidget';
import { AiAcademyWidget } from './AiAcademyWidget';
import { AiAcademyHubWidget } from './AiAcademyHubWidget';
import { KindleWidget } from './KindleWidget';
import { AiGuidesWidget } from './ai-guides/AiGuidesWidget';

interface ExpandedWidgetPanelProps {
  type: ExpandedWidgetType;
  onClose: () => void;
  config?: AppConfig;
  initialData?: any; // Data passed from chat widget interaction
  instanceKey?: number; // Force remount of nested widgets when switching contexts
  /** When true (e.g. for Plan widget), panel opens in full screen by default */
  initialFullScreen?: boolean;
  /** Notify parent when full screen state changes (e.g. so chat can recenter) */
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

export const ExpandedWidgetPanel: React.FC<ExpandedWidgetPanelProps> = ({ type, onClose, config, initialData, instanceKey, initialFullScreen, onFullScreenChange }) => {
  const [isFullScreen, setIsFullScreen] = useState(initialFullScreen ?? false);

  useEffect(() => {
    onFullScreenChange?.(isFullScreen);
  }, [isFullScreen, onFullScreenChange]);

  if (!type) return null;

  const getTitle = () => {
    switch(type) {
      case 'calendar': return 'Calendar';
      case 'maps': return 'Google Maps';
      case 'places': return 'Nearby Places';
      case 'youtube': return 'Video Player';
      case 'graph': return 'Data Visualization';
      case 'forms': return 'Transaction Wizard';
      case 'contacts': return 'Contacts Directory';
      case 'plan': return 'Service Plan';
      case 'academy': return 'Ai Academy';
      case 'academy_hub': return 'Ai Hub';
      case 'kindle': return 'PDF Viewer';
      case 'ai_guides': return 'Ai Guide';
      default: return 'Widget';
    }
  };

  const isFullBleed = type === 'contacts' || type === 'forms' || type === 'calendar' || type === 'plan' || type === 'academy' || type === 'academy_hub' || type === 'kindle' || type === 'ai_guides';
  // Hide the generic header if the widget provides its own controls (contacts/forms/calendar/plan)
  const showHeader = type !== 'contacts' && type !== 'forms' && type !== 'calendar' && type !== 'plan' && type !== 'academy' && type !== 'academy_hub' && type !== 'kindle' && type !== 'ai_guides';
  const transactionsTable = config?.tableDefinitions.find((t) => t.id === 'transactions');

  return (
    <div className={`
      flex flex-col bg-white shadow-xl border-l border-gray-200 animate-in slide-in-from-right-10 duration-300
      ${isFullScreen 
        ? 'fixed top-0 left-0 right-0 bottom-0 z-[500] pb-[80px]' // Full screen overlay above headers
        : 'h-full'}
    `}>
      {/* No floating overlay: all full-bleed widgets (Plan, Contacts, Forms, Calendar, Academy, Kindle) use their own header with standard controls (Fullscreen + Close). */}
      {/* Header - Only for generic widgets */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
           <div className="flex items-center gap-2 text-gray-800 font-bold">
             <Maximize2 size={18} className="text-[#141D84]" />
             <span>{getTitle()}</span>
           </div>
           <button 
             onClick={onClose}
             className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
           >
             <X size={20} />
           </button>
        </div>
      )}

      {/* Content Area */}
      <div className={`flex-1 bg-gray-50 ${isFullBleed ? 'p-0 overflow-hidden flex flex-col' : 'p-6 overflow-y-auto flex justify-center'}`}>
        <div className={`w-full ${isFullBleed ? 'h-full flex-1' : 'max-w-2xl'}`}>
          {type === 'maps' && (
             <div className="w-full h-full min-h-[500px] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0, minHeight: '500px' }}
                    loading="lazy" 
                    allowFullScreen
                    src="https://maps.google.com/maps?q=1234+Market+Street+San+Francisco+CA&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  >
                  </iframe>
             </div>
          )}
          
          {type === 'youtube' && (
            <div className="w-full">
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-xl">
                 <iframe 
                   width="100%" 
                   height="100%" 
                   src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                   title="YouTube video player" 
                   frameBorder="0" 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                 ></iframe>
              </div>
              <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                 <h2 className="text-xl font-bold text-gray-900">Top 5 Negotiation Tactics for 2024</h2>
                 <p className="text-gray-600 mt-2">An in-depth look at how to handle difficult conversations in real estate transactions.</p>
              </div>
            </div>
          )}

          {type === 'calendar' && (
             <div className="w-full h-full flex flex-col bg-white">
                 {/* Calendar Header Bar */}
                 <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#5972d0] to-[#141D84] flex-shrink-0">
                   <div className="flex items-center gap-2 text-white">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                     <span className="font-semibold">Calendar</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors" title={isFullScreen ? "Exit fullscreen" : "Fullscreen"}>
                       {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                     </button>
                     <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors" title="Close">
                       <X size={20} />
                     </button>
                   </div>
                 </div>
                 
                 {/* Calendar Content */}
                 <div className="flex-1 overflow-hidden">
                   <CalendarWidget isExpanded={true} />
                 </div>
             </div>
          )}

          {type === 'places' && (
             <div className="grid grid-cols-1 gap-4">
                <PlacesWidget />
                <PlacesWidget />
             </div>
          )}
          
          {type === 'graph' && (
             <div className="w-full h-[500px]">
                <GraphWidget />
             </div>
          )}

          {type === 'forms' && (
             <div className="w-full h-full">
                <FormsWidget 
                  corpusData={config?.corpusData} 
                  schema={transactionsTable?.schema}
                  title={transactionsTable?.name || 'Transactions'}
                  firstStepTitle="Transaction Type"
                  onExpand={undefined}
                  onClose={onClose}
                  onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                  isFullScreen={isFullScreen}
                />
             </div>
          )}

          {type === 'contacts' && (
             <ContactsWidget 
               isExpanded={true} 
               initialSelectedId={initialData} 
               tableDef={config?.tableDefinitions.find(t => t.id === 'contacts')}
               onClose={onClose}
               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
               isFullScreen={isFullScreen}
             />
          )}

          {type === 'plan' && (
             <PlanWidget 
               isExpanded={true}
               onClose={onClose}
               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
               isFullScreen={isFullScreen}
               planId={initialData?.planId}
               ownerId={initialData?.ownerId}
               showNav={true}
               loadKey={instanceKey}
             />
          )}

          {type === 'academy' && (
             <AiAcademyWidget
               onClose={onClose}
               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
               isFullScreen={isFullScreen}
               agentId={initialData?.agentId}
               agentName={initialData?.agentName}
             />
          )}

          {type === 'academy_hub' && (
             <AiAcademyHubWidget
               onClose={onClose}
               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
               isFullScreen={isFullScreen}
               agentId={initialData?.agentId}
               agentName={initialData?.agentName}
             />
          )}

          {type === 'kindle' && (
             <KindleWidget
               onClose={onClose}
               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
               isFullScreen={isFullScreen}
               agentId={initialData?.agentId}
               agentName={initialData?.agentName}
             />
          )}

          {type === 'ai_guides' && (
             <AiGuidesWidget
               onClose={onClose}
               onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
               isFullScreen={isFullScreen}
             />
          )}

        </div>
      </div>
    </div>
  );
};
