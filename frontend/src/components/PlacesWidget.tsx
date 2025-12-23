
import React from 'react';
import { Star, MapPin, Phone, Maximize2, DollarSign, TrendingUp } from 'lucide-react';

interface PlacesWidgetProps {
  onExpand?: () => void;
}

const PLACE_RESULTS = [
  {
    id: 1,
    name: "Luxury Loft Downtown",
    rating: 4.8,
    reviews: 124,
    type: "Real Estate Agency",
    address: "800 Market St",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 2,
    name: "Urban Living Partners",
    rating: 4.5,
    reviews: 89,
    type: "Property Management",
    address: "200 Mission St",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 3,
    name: "Skyline Brokers",
    rating: 4.9,
    reviews: 210,
    type: "Commercial Real Estate",
    address: "101 California St",
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=150&q=80"
  },
  {
    id: 4,
    name: "Bay View Estates",
    rating: 4.7,
    reviews: 156,
    type: "Luxury Homes",
    address: "450 Powell St",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=150&q=80"
  }
];

export const PlacesWidget: React.FC<PlacesWidgetProps> = ({ onExpand }) => {
  return (
    <div 
      className="w-full max-w-2xl mt-2 animate-fade-in relative group cursor-pointer"
      onClick={onExpand}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold text-gray-500 uppercase">Property Listings</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-600 font-medium hover:underline">View all</span>
          {onExpand && (
            <button 
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Expand"
            >
              <Maximize2 size={12} />
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLACE_RESULTS.map(place => (
          <div key={place.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 relative overflow-hidden group/card">
            
            {/* Card Header */}
            <div className="flex gap-3">
              <img 
                src={place.image} 
                alt={place.name} 
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm truncate">{place.name}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-600 my-0.5">
                  <span className="text-amber-500 flex items-center gap-0.5 font-bold">
                    {place.rating} <Star size={10} fill="currentColor" />
                  </span>
                  <span className="text-gray-300">•</span>
                  <span>({place.reviews})</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
                   <MapPin size={10} />
                   {place.address}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button 
                className="flex items-center justify-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-xs font-bold py-1.5 rounded-lg transition-colors"
                onClick={(e) => { e.stopPropagation(); alert('Buy action'); }}
              >
                <DollarSign size={12} />
                Buy
              </button>
              <button 
                className="flex items-center justify-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold py-1.5 rounded-lg transition-colors"
                onClick={(e) => { e.stopPropagation(); alert('Sell action'); }}
              >
                <TrendingUp size={12} />
                Sell
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};
