-- Clip Art Database Schema
-- Run this to set up your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Images table (primary source of truth)
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Cloudinary references
  cloudinary_public_id VARCHAR(255) UNIQUE NOT NULL,
  cloudinary_url TEXT NOT NULL,
  cloudinary_secure_url TEXT NOT NULL,
  
  -- Metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  alt_text TEXT,
  
  -- Categorization
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  
  -- File information
  file_format VARCHAR(10) NOT NULL, -- png, jpg, svg, etc.
  width INTEGER,
  height INTEGER,
  file_size INTEGER, -- in bytes
  
  -- SEO
  seo_slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Publishing
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  
  -- Analytics
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  image_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Downloads tracking (for analytics)
CREATE TABLE IF NOT EXISTS downloads (
  id SERIAL PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- Image views tracking
CREATE TABLE IF NOT EXISTS image_views (
  id SERIAL PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- Popular tags (for autocomplete and trending)
CREATE TABLE IF NOT EXISTS tag_stats (
  tag VARCHAR(100) PRIMARY KEY,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_tags ON images USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category);
CREATE INDEX IF NOT EXISTS idx_images_published ON images(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_published_at ON images(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_seo_slug ON images(seo_slug);
CREATE INDEX IF NOT EXISTS idx_downloads_image_id ON downloads(image_id);
CREATE INDEX IF NOT EXISTS idx_downloads_timestamp ON downloads(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_views_image_id ON image_views(image_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_images_updated_at 
  BEFORE UPDATE ON images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update category image count
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories SET image_count = image_count + 1 WHERE slug = NEW.category;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories SET image_count = image_count - 1 WHERE slug = OLD.category;
  ELSIF TG_OP = 'UPDATE' AND NEW.category != OLD.category THEN
    UPDATE categories SET image_count = image_count - 1 WHERE slug = OLD.category;
    UPDATE categories SET image_count = image_count + 1 WHERE slug = NEW.category;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update category counts
CREATE TRIGGER update_category_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON images
  FOR EACH ROW
  EXECUTE FUNCTION update_category_count();

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
  ('Christmas', 'christmas', 'Christmas themed clip art'),
  ('Halloween', 'halloween', 'Halloween themed clip art'),
  ('Food', 'food', 'Food and drink clip art'),
  ('Flowers', 'flowers', 'Flower and nature clip art'),
  ('Animals', 'animals', 'Animal clip art'),
  ('Cats', 'cats', 'Cat themed clip art'),
  ('Birthday', 'birthday', 'Birthday celebration clip art'),
  ('Holidays', 'holidays', 'Holiday themed clip art'),
  ('Nature', 'nature', 'Nature and landscape clip art'),
  ('People', 'people', 'People and characters clip art')
ON CONFLICT (slug) DO NOTHING;

-- Create a view for published images with stats
CREATE OR REPLACE VIEW published_images_with_stats AS
SELECT 
  i.*,
  c.name as category_name,
  COUNT(DISTINCT d.id) as total_downloads,
  COUNT(DISTINCT v.id) as total_views
FROM images i
LEFT JOIN categories c ON i.category = c.slug
LEFT JOIN downloads d ON i.id = d.image_id
LEFT JOIN image_views v ON i.id = v.image_id
WHERE i.published = true
GROUP BY i.id, c.name;

-- Email waitlist table for lead collection
CREATE TABLE IF NOT EXISTS email_waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) DEFAULT 'homepage', -- where they signed up from
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP,
  notes TEXT
);

-- Index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON email_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_subscribed ON email_waitlist(subscribed_at DESC);

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;


