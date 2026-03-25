export interface LearnPostAuthor {
  name: string;
  role: string;
  avatar: string;
}

export interface LearnPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  durationSeconds: number;
  topic: string[];
  categoryLabel: string;
  muxPlaybackId: string;
  youtubeId?: string;
  thumbnailUrl: string;
  author: LearnPostAuthor;
  relatedSlugs: string[];
  relatedCategories: string[];
}

export interface LearnPost {
  meta: LearnPostMeta;
  content: string;
  transcript: string;
}
