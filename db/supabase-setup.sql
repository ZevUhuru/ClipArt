-- Supabase Production Database Setup
-- Run this in your Supabase SQL Editor

-- Email waitlist table (if not exists)
CREATE TABLE IF NOT EXISTS email_waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) DEFAULT 'homepage',
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP,
  notes TEXT
);

-- Downloads tracking table for homepage images
CREATE TABLE IF NOT EXISTS downloads_by_url (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  email VARCHAR(255),
  category VARCHAR(100),
  image_title VARCHAR(255),
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON email_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_subscribed ON email_waitlist(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_by_url_image_url ON downloads_by_url(image_url);
CREATE INDEX IF NOT EXISTS idx_downloads_by_url_category ON downloads_by_url(category);
CREATE INDEX IF NOT EXISTS idx_downloads_by_url_downloaded_at ON downloads_by_url(downloaded_at DESC);

-- Note: RLS is disabled for these tables since they're accessed via direct connection
-- Your Netlify API uses the postgres role via connection string, which bypasses RLS
-- If you want to enable RLS later, you'll need to create policies for the 'postgres' role

