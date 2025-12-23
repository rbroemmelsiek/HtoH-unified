
import React, { useState } from 'react';
import { ExpandedWidgetType, AppConfig } from '../types';
import { X, Maximize2 } from 'lucide-react';
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

// #region agent log
const __agentLog = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    fetch('http://127.0.0.1:7243/ingest/4469576f-e0f7-44d6-988c-2bfc5cb48a06',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId,location,message,data,timestamp:Date.now()})}).catch(()=>{});
  } catch (_) {}
};
// #endregion

interface ExpandedWidgetPanelProps {
  type: ExpandedWidgetType;
  onClose: () => void;
  config?: AppConfig;
  initialData?: any; // Data passed from chat widget interaction
  instanceKey?: number; // Force remount of nested widgets when switching contexts
}

export const ExpandedWidgetPanel: React.FC<ExpandedWidgetPanelProps> = ({ type, onClose, config, initialData, instanceKey }) => {
  __agentLog('H7','ExpandedWidgetPanel.tsx:renderType','render expanded widget',{type});
  const [isFullScreen, setIsFullScreen] = useState(false);

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
      default: return 'Widget';
    }
  };

  const isFullBleed = type === 'contacts' || type === 'forms' || type === 'calendar' || type === 'plan' || type === 'academy' || type === 'academy_hub' || type === 'kindle';
  // Hide the generic header if the widget provides its own controls (contacts/forms/calendar/plan)
  const showHeader = type !== 'contacts' && type !== 'forms' && type !== 'calendar' && type !== 'plan' && type !== 'academy' && type !== 'academy_hub' && type !== 'kindle';

  return (
    <div className={`
      flex flex-col bg-white shadow-xl border-l border-gray-200 animate-in slide-in-from-right-10 duration-300
      ${isFullScreen 
        ? 'fixed top-0 left-0 right-0 bottom-0 z-[500] pb-[80px]' // Full screen overlay above headers
        : 'h-full'}
    `}>
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
                   <button 
                      onClick={onClose}
                      className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
                      title="Close"
                   >
                      <X size={20} />
                   </button>
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

        </div>
      </div>
    </div>
  );
};
