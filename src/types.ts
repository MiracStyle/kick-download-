export interface ClipQuality {
  id: string;
  label: string;
  description: string;
  ext: string;
}

export interface ClipData {
  id: string;
  title: string;
  clip_url: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  views: number;
  created_at: string;
  category?: {
    id?: number;
    name: string;
    slug?: string;
  };
  creator?: {
    username: string;
    slug?: string;
    profile_picture?: string;
  };
  channel?: {
    username: string;
    slug?: string;
    profile_picture?: string;
  };
  qualities?: ClipQuality[];
}

export interface HistoryItem {
  id: string;
  clipId: string;
  title: string;
  channel: string;
  channelAvatar?: string;
  thumbnail: string;
  duration: number;
  views: number;
  timestamp: number;
  streamUrl: string;
}

export interface QueueItem {
  id: string;
  url: string;
  clip?: ClipData;
  vod?: VodData;
  quality: string;
  format: 'mp4' | 'webm' | 'avi' | 'mkv' | 'mp3' | 'm4a' | string;
  bitrate?: string;
  status: 'pending' | 'fetching' | 'ready' | 'downloading' | 'done' | 'error';
  error?: string;
}

export interface VodQualityOption {
  id: string;
  label: string;
  resolution: string;
  fps?: number;
  url: string;
}

export interface VodData {
  uuid: string;
  id?: number;
  title: string;
  channel: {
    username: string;
    slug: string;
    profile_picture?: string | null;
  };
  duration: number; // in seconds
  created_at: string;
  views: number;
  thumbnail_url: string;
  source: string; // master m3u8
  is_live: boolean;
  qualities: VodQualityOption[];
}

export interface ChannelVodSummary {
  id: number;
  uuid: string;
  title: string;
  duration: number; // in seconds
  created_at: string;
  views: number;
  thumbnail_url: string;
  source?: string;
  categories?: string[];
}

export interface ChannelData {
  id: number;
  username: string;
  slug: string;
  profile_picture?: string | null;
  banner_image?: string | null;
  bio?: string | null;
  followers_count: number;
  is_live: boolean;
  live_playback_url?: string | null;
  live_session?: {
    id: number;
    title: string;
    viewer_count: number;
    start_time: string;
    category?: string;
  } | null;
  vods: ChannelVodSummary[];
}
