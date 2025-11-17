import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, imageUrl, imageTitle, category } = req.body;

  if (!email || !imageUrl) {
    return res.status(400).json({ error: 'Email and imageUrl are required' });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Add email to waitlist (or update if exists)
    const waitlistQuery = `
      INSERT INTO email_waitlist (email, source, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET subscribed_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    const source = `download-${category || 'unknown'}`;
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const user_agent = req.headers['user-agent'] || null;

    await client.query(waitlistQuery, [email.toLowerCase().trim(), source, ip_address, user_agent]);

    // 2. Track download - create downloads_by_url table for homepage images
    try {
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

      // Create index for faster queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_downloads_by_url_image_url ON downloads_by_url(image_url);
        CREATE INDEX IF NOT EXISTS idx_downloads_by_url_category ON downloads_by_url(category);
        CREATE INDEX IF NOT EXISTS idx_downloads_by_url_downloaded_at ON downloads_by_url(downloaded_at DESC);
      `);

      const downloadQuery = `
        INSERT INTO downloads_by_url (image_url, email, category, image_title, downloaded_at, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
      `;
      
      await client.query(downloadQuery, [
        imageUrl, 
        email.toLowerCase().trim(), 
        category || null, 
        imageTitle || null,
        ip_address, 
        user_agent
      ]);
    } catch (err: any) {
      console.error('Download tracking error:', err);
      // Don't fail the request if tracking fails
    }

    await client.query('COMMIT');

    res.status(200).json({ 
      success: true,
      message: 'Download recorded successfully'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Download tracking error:', error);
    res.status(500).json({ error: 'Failed to record download' });
  } finally {
    client.release();
  }
}

