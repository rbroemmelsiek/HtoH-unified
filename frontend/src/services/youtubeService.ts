
import { VideoData } from '../types';

// IMPORTANT: In a production environment, this Key should be in process.env
// and ideally, API calls should be proxied through a backend to protect the key.
// Get API key from multiple sources for compatibility with Google AI Studio and Vite
const getYouTubeApiKey = (): string => {
  // Try import.meta.env (Vite/modern bundlers)
  if (typeof import.meta !== 'undefined') {
     const env = (import.meta as any).env;
     if (env) {
        const key = env.YOUTUBE_API_KEY;
        if (key) return key;
     }
  }
  // Try process.env (Node.js/Vite define)
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.YOUTUBE_API_KEY;
    if (key) return key;
  }
  // Try global variables (Google AI Studio or manual injection)
  if (typeof window !== 'undefined') {
    const key = (window as any).YOUTUBE_API_KEY;
    if (key) return key;
  }
  if (typeof globalThis !== 'undefined') {
    const key = (globalThis as any).YOUTUBE_API_KEY;
    if (key) return key;
  }
  // Fall back to placeholder
  return 'YOUR_API_KEY_HERE';
};

const YOUTUBE_API_KEY = getYouTubeApiKey();
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetches videos from YouTube based on a search query.
 * @param query The search term (e.g., "Real Estate Negotiation")
 * @param maxResults Number of videos to return
 */
export const searchYouTubeVideos = async (query: string, maxResults: number = 5): Promise<VideoData[]> => {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn("YouTube API Key is missing. Returning mock data.");
    return []; // Returns empty to trigger mock fallback in UI
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform API response to our VideoData interface
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      channel: item.snippet.channelTitle,
      // The search endpoint doesn't provide statistics (views/likes) or duration directly.
      // To get these, you would need a secondary call to the 'videos' endpoint using the IDs.
      // For this demo, we mock the missing stats or leave them generic.
      views: 'N/A', 
      date: new Date(item.snippet.publishedAt).toLocaleDateString(),
      duration: '00:00',
      likes: 0
    }));

  } catch (error) {
    console.error("Failed to fetch YouTube videos:", error);
    return [];
  }
};

/**
 * Fetches detailed video statistics (duration, views, likes) for a specific list of IDs.
 * This is a secondary step often required because 'search' is lightweight.
 */
export const getVideoDetails = async (videoIds: string[]): Promise<Record<string, Partial<VideoData>>> => {
  if (!YOUTUBE_API_KEY) return {};

  try {
    const response = await fetch(
      `${BASE_URL}/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
    );
    
    const data = await response.json();
    const details: Record<string, Partial<VideoData>> = {};

    data.items.forEach((item: any) => {
      details[item.id] = {
        views: formatViewCount(item.statistics.viewCount),
        likes: parseInt(item.statistics.likeCount || '0'),
        duration: parseDuration(item.contentDetails.duration)
      };
    });

    return details;

  } catch (error) {
    return {};
  }
};

// Helper to format ISO 8601 duration (PT15M33S) to 15:33
const parseDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '00:00';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');

  let result = '';
  if (hours) result += `${hours}:`;
  result += `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  
  return result.startsWith(':') ? result.substring(1) : result;
};

const formatViewCount = (views: string): string => {
  const num = parseInt(views);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M views';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K views';
  return num + ' views';
};
