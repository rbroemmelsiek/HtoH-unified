
import React, { useState } from 'react';
import { Play, Maximize2, MoreVertical, Cast, Heart, Share2, Smartphone, Monitor, List } from 'lucide-react';
import { VideoData } from '../types';

interface YouTubeWidgetProps {
  onExpand?: () => void;
  // In a real app, you might pass the fetched videos here
  videos?: VideoData[]; 
}

const MOCK_PLAYLIST: VideoData[] = [
  {
    id: '1',
    title: "Top 5 Negotiation Tactics for 2024 - Real Estate Mastery",
    description: "Master the art of the deal with these essential psychological strategies.",
    thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
    url: "#",
    channel: "Real Estate Mastery",
    views: "14K views",
    date: "2 days ago",
    duration: "12:45",
    likes: 1240
  },
  {
    id: '2',
    title: "Understanding Purchase Agreements: Clause by Clause",
    description: "Don't let fine print trip you up. We break down the standard purchase agreement.",
    thumbnail: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    url: "#",
    channel: "Legal Eagle Realty",
    views: "8.2K views",
    date: "1 week ago",
    duration: "08:30",
    likes: 856
  },
  {
    id: '3',
    title: "Market Update: Interest Rates & Inventory",
    description: "What is happening in the market right now? We analyze the latest trends.",
    thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80",
    url: "#",
    channel: "Market Watch",
    views: "22K views",
    date: "5 hours ago",
    duration: "15:10",
    likes: 2100
  },
  {
    id: '4',
    title: "Staging Secrets That Sell Homes Faster",
    description: "Simple tips to make any home look million-dollar ready.",
    thumbnail: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
    url: "#",
    channel: "Design & Sell",
    views: "5K views",
    date: "3 days ago",
    duration: "06:15",
    likes: 430
  }
];

export const YouTubeWidget: React.FC<YouTubeWidgetProps> = ({ onExpand, videos }) => {
  const [viewMode, setViewMode] = useState<'landscape' | 'portrait' | 'compact'>('compact');
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});

  // Use passed videos or fallback to mock playlist
  const displayVideos = videos && videos.length > 0 ? videos : MOCK_PLAYLIST;
  // For landscape/portrait, we just show the first video for demo purposes
  const featuredVideo = displayVideos[0];

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIsLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const LikeButton = ({ video }: { video: VideoData }) => (
    <button 
      onClick={(e) => toggleLike(e, video.id)}
      className={`p-2 rounded-full transition-colors ${isLiked[video.id] ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
      title="Like"
    >
      <Heart size={18} fill={isLiked[video.id] ? "currentColor" : "none"} />
    </button>
  );

  const Thumbnail = ({ video, mode }: { video: VideoData, mode: 'landscape' | 'portrait' | 'compact' }) => (
    <div className={`relative overflow-hidden group/thumb ${
      mode === 'portrait' ? 'aspect-[9/16]' : 
      mode === 'compact' ? 'w-24 h-16 rounded-md flex-shrink-0' : 'aspect-video'
    }`}>
      <img 
        src={video.thumbnail} 
        alt={video.title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/thumb:bg-black/20 transition-colors">
         <div className={`
           bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover/thumb:scale-110
           ${mode === 'compact' ? 'w-6 h-6' : 'w-12 h-12'}
         `}>
           <Play fill="currentColor" size={mode === 'compact' ? 10 : 20} className={mode === 'compact' ? "ml-0.5" : "ml-1"} />
         </div>
      </div>
      {mode !== 'compact' && (
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          {video.duration}
        </div>
      )}
    </div>
  );

  // --- Render Modes ---

  const renderLandscape = () => (
    <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 group relative">
      <Thumbnail video={featuredVideo} mode="landscape" />
      
      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <h5 className="text-white text-xs font-medium line-clamp-1 text-shadow opacity-0 group-hover:opacity-100 transition-opacity">{featuredVideo.title}</h5>
          <div className="flex gap-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-white hover:text-gray-200"><Cast size={16}/></button>
            {onExpand && (
              <button
                onClick={(e) => { e.stopPropagation(); onExpand(); }}
                className="p-1.5 rounded-full bg-[#141D84] text-[#F9FAFB] hover:bg-gray-100 hover:text-[#141D84] transition-colors"
              >
                <Maximize2 size={16}/>
              </button>
            )}
          </div>
      </div>

      <div className="p-3 bg-gray-900 text-white">
         <div className="flex justify-between items-start gap-2">
            <div className="flex gap-3 items-start">
               <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                 RM
               </div>
               <div>
                  <h4 className="font-bold text-sm line-clamp-2 text-gray-100 leading-tight">{featuredVideo.title}</h4>
                  <div className="text-xs text-gray-400 mt-1">{featuredVideo.channel} • {featuredVideo.views}</div>
               </div>
            </div>
            <div className="flex gap-1">
               <LikeButton video={featuredVideo} />
               <button className="p-2 text-gray-400 hover:text-white"><MoreVertical size={18} /></button>
            </div>
         </div>
      </div>
    </div>
  );

  const renderPortrait = () => (
    <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 group relative max-w-[200px] mx-auto">
       <Thumbnail video={featuredVideo} mode="portrait" />
       
       <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <h4 className="text-white font-bold text-sm line-clamp-2 mb-1">{featuredVideo.title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
             <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold">RM</div>
             <span className="truncate">{featuredVideo.channel}</span>
          </div>
          
          <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-2">
             <button onClick={(e) => toggleLike(e, featuredVideo.id)} className="flex flex-col items-center gap-0.5 text-white">
                <Heart size={16} fill={isLiked[featuredVideo.id] ? "currentColor" : "none"} className={isLiked[featuredVideo.id] ? "text-red-500" : ""} />
                <span className="text-[10px]">{isLiked[featuredVideo.id] ? featuredVideo.likes + 1 : featuredVideo.likes}</span>
             </button>
             <button className="flex flex-col items-center gap-0.5 text-white">
                <Share2 size={16} />
                <span className="text-[10px]">Share</span>
             </button>
             {onExpand && (
              <button
                onClick={(e) => { e.stopPropagation(); onExpand(); }}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-full bg-[#141D84] text-[#F9FAFB] hover:bg-gray-100 hover:text-[#141D84] transition-colors"
              >
                  <Maximize2 size={16} />
                  <span className="text-[10px]">View</span>
               </button>
             )}
          </div>
       </div>
    </div>
  );

  const renderCompact = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Related Videos</span>
        {onExpand && (
           <button 
             onClick={(e) => { e.stopPropagation(); onExpand(); }} 
             className="p-1.5 rounded-full bg-[#141D84] text-[#F9FAFB] hover:bg-gray-100 hover:text-[#141D84] transition-colors"
             title="Expand"
           >
             <Maximize2 size={14} />
           </button>
         )}
      </div>
      
      {/* TIGHT MARGINS: Using space-y-0.5 or divide-y with minimal padding */}
      <div className="flex flex-col divide-y divide-gray-100">
        {displayVideos.map((video) => (
          <div 
            key={video.id} 
            className="flex items-center gap-3 p-2 hover:bg-blue-50/50 transition-colors group cursor-pointer"
            onClick={(e) => e.stopPropagation()} // Prevent expanding when clicking items in list (or allow it if desired)
          >
            <Thumbnail video={video} mode="compact" />
            
            <div className="flex-1 min-w-0 self-center">
              <a href={video.url} onClick={(e) => e.preventDefault()} className="block">
                <h3 className="font-bold text-gray-800 text-xs leading-tight line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                  {video.title}
                </h3>
                <p className="text-[10px] text-gray-500 line-clamp-1 mb-0.5">{video.description}</p>
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span>{video.channel}</span>
                  <span>•</span>
                  <span>{video.duration}</span>
                </div>
              </a>
            </div>

            <div className="flex flex-col items-center justify-center border-l border-gray-100 pl-2 h-full">
               <LikeButton video={video} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      className={`w-full mt-2 animate-fade-in relative cursor-default transition-all
        ${viewMode === 'portrait' ? 'max-w-xs' : 'max-w-sm'}
      `}
    >
      {viewMode === 'landscape' && renderLandscape()}
      {viewMode === 'portrait' && renderPortrait()}
      {viewMode === 'compact' && renderCompact()}

      {/* View Mode Toggles */}
      <div className="flex justify-center mt-2 gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
        <button 
          onClick={() => setViewMode('compact')}
          className={`p-1.5 rounded border text-[10px] flex items-center gap-1 ${viewMode === 'compact' ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}
          title="Compact / Playlist View"
        >
          <List size={12} /> List
        </button>
        <button 
          onClick={() => setViewMode('landscape')}
          className={`p-1.5 rounded border text-[10px] flex items-center gap-1 ${viewMode === 'landscape' ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}
          title="Landscape View"
        >
          <Monitor size={12} /> Card
        </button>
        <button 
          onClick={() => setViewMode('portrait')}
          className={`p-1.5 rounded border text-[10px] flex items-center gap-1 ${viewMode === 'portrait' ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}
          title="Portrait View"
        >
          <Smartphone size={12} /> Shorts
        </button>
      </div>
    </div>
  );
};
