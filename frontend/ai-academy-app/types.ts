
export interface BookPageData {
  pageNumber: number;
  title: string;
  content: string; // OCR text for AI search
  imageUrl?: string; // High-res page capture
  youtubeUrl: string;
  shortsUrl: string;
  category: string;
  keywords: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  navHint?: number; // Optional page number to jump to
  isLesson?: boolean;
}

export enum AppMode {
  Viewer = 'viewer',
  Data = 'data',
  Lessons = 'lessons',
  LiveSession = 'live_session'
}

export enum AutoplayMode {
  None = 'none',
  Single = 'single',
  Continuous = 'continuous'
}

export type LessonDifficulty = 'Basic' | 'Intermediate' | 'Advanced';

export interface LessonState {
  isActive: boolean;
  difficulty: LessonDifficulty | null;
  currentStep: number;
  score: number;
}

export interface LiveSession {
  id: string;
  title: string;
  instructor: string;
  type: 'Live Course' | '1:1 Coaching' | 'Instructor Training';
  startTime: string;
  meetUrl: string;
  status: 'Live' | 'Upcoming' | 'Ready';
}
