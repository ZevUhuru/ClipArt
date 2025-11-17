import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Use connection pooler for serverless (Netlify)
// Pooler URL format: postgresql://postgres:[PASSWORD]@[PROJECT].pooler.supabase.com:6543/postgres
// Direct URL format: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Optimize for serverless
  max: 1, // Serverless functions should use 1 connection
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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

    // 2. Track download - insert into downloads_by_url table
    // Note: Table must be created manually in Supabase SQL Editor (pooler doesn't support CREATE TABLE)
    // Run db/supabase-setup.sql in Supabase SQL Editor first
    try {
      const downloadQuery = `
        INSERT INTO downloads_by_url (image_url, email, category, image_title, downloaded_at, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
      `;
      
      const downloadResult = await client.query(downloadQuery, [
        imageUrl, 
        email.toLowerCase().trim(), 
        category || null, 
        imageTitle || null,
        ip_address, 
        user_agent
      ]);

      console.log('Download tracked successfully:', {
        imageUrl,
        category,
        email: email.toLowerCase().trim(),
      });
    } catch (err: any) {
      // Log detailed error for debugging
      console.error('Download tracking error:', {
        message: err.message,
        code: err.code,
        detail: err.detail,
        hint: err.hint,
        // Common error: table doesn't exist - run db/supabase-setup.sql in Supabase SQL Editor
        tableExists: err.message?.includes('does not exist') ? false : undefined,
      });
      
      // Return error details in response for debugging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error:', err);
      }
      
      // Don't fail the request if tracking fails - download still works
    }

    await client.query('COMMIT');

    res.status(200).json({ 
      success: true,
      message: 'Download recorded successfully'
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Download API error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
    res.status(500).json({ 
      error: 'Failed to record download',
      // Include error details in development
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        code: error.code,
      }),
    });
  } finally {
    client.release();
  }
}

