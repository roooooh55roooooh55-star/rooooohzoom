
export type VideoType = 'short' | 'long';

export interface VideoAudioSettings {
  titleEnabled: boolean;
  narrationEnabled: boolean;
}

export interface Video {
  id: string;
  video_url: string;
  poster_url?: string;
  type: VideoType;
  likes: number;
  views: number; // المشاهدات الوهمية (للمستخدم)
  realViews?: number; // المشاهدات الحقيقية (للمطور)
  title: string;
  category: string;
  tags?: string[];
  narration?: string; 
  audioSettings?: VideoAudioSettings; // إعدادات الصوت المقررة من المطور
  created_at?: string;
  public_id: string;
  external_link?: string;
  isFeatured?: boolean;
}

export interface UserInteractions {
  likedIds: string[];
  dislikedIds: string[];
  savedIds: string[];
  savedCategoryNames: string[]; 
  watchHistory: { id: string; progress: number }[];
  downloadedIds: string[];
  audioPrefs: {
    titleEnabled: boolean;
    narrationEnabled: boolean;
  };
}

export enum AppView {
  HOME = 'home',
  TREND = 'trend',
  LIKES = 'likes',
  SAVED = 'saved',
  UNWATCHED = 'unwatched',
  HIDDEN = 'hidden',
  PRIVACY = 'privacy',
  ADMIN = 'admin',
  CATEGORY = 'category',
  OFFLINE = 'offline'
}
