
import React, { useState } from 'react';
import { MapPin, Navigation, Share2, Maximize2, Map as MapIcon, Eye } from 'lucide-react';

interface MapsWidgetProps {
  onExpand?: () => void;
}

export const MapsWidget: React.FC<MapsWidgetProps> = ({ onExpand }) => {
  const [viewMode, setViewMode] = useState<'map' | 'street'>('map');

  // Demo Coordinates for San Francisco Market St
  // For a real app, this would use the Google Maps Embed API properly with an API Key.
  // Using standard embed URLs for demo purposes.
  const mapUrl = "https://maps.google.com/maps?q=1234+Market+Street+San+Francisco+CA&t=&z=15&ie=UTF8&iwloc=&output=embed";
  
  // Simulating Street View by using a specific embed or placeholder if API key is missing.
  // Standard Google Maps Embed doesn't support direct "layer=c" without API key easily in all contexts,
  // but we can simulate the switch for the UI.
  const streetViewUrl = "https://www.google.com/maps/embed?pb=!4v1700000000000!6m8!1m7!1sM7yW-0-0-0!2m2!1d37.7764!2d-122.4174!3f0!4f0!5f0.7820865974627469"; 

  // Fallback to a static image if the embed doesn't render nicely without key, 
  // but for this code we'll use the iframe source toggle to demonstrate intent.
  
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-none mt-2 animate-fade-in group relative cursor-pointer"
      onClick={onExpand}
    >
      {/* Map Iframe Area */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
         <div className="absolute inset-0 z-10" /> {/* Overlay to capture click for expand, allows interaction via controls below */}
         
         {viewMode === 'map' ? (
           <iframe 
              width="100%" 
              height="100%" 
              style={{ border: 0 }}
              loading="lazy" 
              allowFullScreen
              src={mapUrl}
              className="animate-in fade-in duration-300"
            />
         ) : (
           // Fallback visualization for Street View if URL fails or just to show difference
           <iframe 
              width="100%" 
              height="100%" 
              style={{ border: 0 }}
              loading="lazy" 
              allowFullScreen
              // Using a generic map with satellite as a proxy for "visual" change if strict streetview fails
              src={mapUrl.replace("&t=", "&t=k")} 
              className="animate-in fade-in duration-300"
            />
         )}
         
         {/* View Mode Toggles */}
         <div className="absolute bottom-2 left-2 z-20 flex bg-white rounded-lg shadow-md border border-gray-200 p-1" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'map' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Map View"
            >
              <MapIcon size={14} />
            </button>
            <button 
              onClick={() => setViewMode('street')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'street' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Street View"
            >
              <Eye size={14} />
            </button>
         </div>

        {/* Expand Button */}
        {onExpand && (
          <button 
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="absolute top-2 right-2 z-20 p-1.5 rounded-lg shadow-sm bg-[#141D84] text-[#F9FAFB] hover:bg-gray-100 hover:text-[#141D84] transition-all opacity-0 group-hover:opacity-100"
            title="Expand Map"
          >
            <Maximize2 size={16} />
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/5 to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Location Details */}
      <div className="p-4 relative z-20">
        <div className="flex justify-between items-start">
           <div>
             <h3 className="font-bold text-gray-900 text-base">1234 Market Street</h3>
             <p className="text-gray-500 text-xs mb-3">San Francisco, CA 94103</p>
           </div>
           <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Open Now</div>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            onClick={(e) => { e.stopPropagation(); alert("Directions"); }}
          >
            <Navigation size={14} />
            Directions
          </button>
          <button 
            className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
