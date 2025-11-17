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

// Auto-setup function: Creates tables using direct connection if they don't exist
async function autoSetupDatabase() {
  let connectionString = process.env.DATABASE_URL || '';
  
  // Convert pooler URL to direct connection for DDL operations
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
    console.log('Auto-setup: Tables created successfully');
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await directPool.end();
  }
}

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
      // If table doesn't exist, try to create it automatically
      if (err.message?.includes('does not exist') || err.code === '42P01') {
        console.log('Table missing, attempting auto-setup...');
        try {
          await autoSetupDatabase();
          // Retry the insert after setup
          const retryQuery = `
            INSERT INTO downloads_by_url (image_url, email, category, image_title, downloaded_at, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
          `;
          await client.query(retryQuery, [
            imageUrl, 
            email.toLowerCase().trim(), 
            category || null, 
            imageTitle || null,
            ip_address, 
            user_agent
          ]);
          console.log('Download tracked successfully after auto-setup');
        } catch (setupErr: any) {
          console.error('Auto-setup failed:', setupErr.message);
          // Don't fail the request - download still works
        }
      } else {
        // Log other errors
        console.error('Download tracking error:', {
          message: err.message,
          code: err.code,
          detail: err.detail,
          hint: err.hint,
        });
      }
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

