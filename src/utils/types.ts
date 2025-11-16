// Type definitions for the application

export interface Image {
  id: string;
  cloudinary_public_id: string;
  cloudinary_url: string;
  cloudinary_secure_url: string;
  title: string;
  description?: string;
  alt_text?: string;
  tags: string[];
  category?: string;
  file_format: string;
  width?: number;
  height?: number;
  file_size?: number;
  seo_slug: string;
  published: boolean;
  published_at?: Date;
  scheduled_for?: Date;
  download_count: number;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  image_count: number;
  created_at: Date;
}

export interface Download {
  id: number;
  image_id: string;
  downloaded_at: Date;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
}

export interface ImageView {
  id: number;
  image_id: string;
  viewed_at: Date;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
}

export interface UploadedFile {
  cloudinary_public_id: string;
  cloudinary_url: string;
  cloudinary_secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface ImageFormData {
  title: string;
  description?: string;
  alt_text?: string;
  tags: string[];
  category?: string;
  published: boolean;
  scheduled_for?: Date;
}

export interface TypesenseDocument {
  id: string;
  title: string;
  description: string;
  tags: string;
  category: string;
  image_url: string;
  creation_timestamp: number;
}
