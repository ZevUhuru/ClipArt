import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// This endpoint uses DIRECT connection (not pooler) to create tables
// Called automatically or manually to set up database schema

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin secret
  const secret = req.body.secret || req.query.secret;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Use DIRECT connection for DDL operations (CREATE TABLE)
  // Convert pooler URL to direct URL if needed
  let connectionString = process.env.DATABASE_URL || '';
  
  // If using pooler URL, convert to direct connection
  if (connectionString.includes('pooler.supabase.com')) {
    connectionString = connectionString
      .replace('pooler.supabase.com:6543', 'db.supabase.co:5432')
      .replace('.pooler.', '.');
  }

  const directPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await directPool.connect();

  try {
    await client.query('BEGIN');

    // Create email_waitlist table
    await client.query(`
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
      )
    `);

    // Create downloads_by_url table
    await client.query(`
      CREATE TABLE IF NOT EXISTS downloads_by_url (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        email VARCHAR(255),
        category VARCHAR(100),
        image_title VARCHAR(255),
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_waitlist_email ON email_waitlist(email);
      CREATE INDEX IF NOT EXISTS idx_waitlist_subscribed ON email_waitlist(subscribed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_downloads_by_url_image_url ON downloads_by_url(image_url);
      CREATE INDEX IF NOT EXISTS idx_downloads_by_url_category ON downloads_by_url(category);
      CREATE INDEX IF NOT EXISTS idx_downloads_by_url_downloaded_at ON downloads_by_url(downloaded_at DESC);
    `);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Database tables created successfully',
      tables: ['email_waitlist', 'downloads_by_url'],
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Database setup error:', error);
    res.status(500).json({
      error: 'Failed to create tables',
      details: error.message,
      code: error.code,
    });
  } finally {
    client.release();
    await directPool.end();
  }
}

