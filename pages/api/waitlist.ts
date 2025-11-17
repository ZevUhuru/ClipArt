import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

// Use connection pooler for serverless (Netlify)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_waitlist_email ON email_waitlist(email);
      CREATE INDEX IF NOT EXISTS idx_waitlist_subscribed ON email_waitlist(subscribed_at DESC);
    `);

    await client.query('COMMIT');
    console.log('Auto-setup: email_waitlist table created successfully');
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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, source = 'homepage' } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get IP address and user agent for tracking
    const ip_address = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress;
    
    const user_agent = req.headers['user-agent'] || null;

    // Insert into database
    const query = `
      INSERT INTO email_waitlist (email, source, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) 
      DO UPDATE SET subscribed_at = CURRENT_TIMESTAMP
      RETURNING id, email, subscribed_at
    `;

    const values = [email.toLowerCase().trim(), source, ip_address, user_agent];
    
    let result;
    try {
      result = await pool.query(query, values);
    } catch (err: any) {
      // If table doesn't exist, try to create it automatically
      if (err.message?.includes('does not exist') || err.code === '42P01') {
        console.log('Table missing, attempting auto-setup...');
        await autoSetupDatabase();
        // Retry the insert after setup
        result = await pool.query(query, values);
      } else {
        throw err;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed!',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Waitlist signup error:', error);
    
    // Handle specific PostgreSQL errors
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Failed to subscribe. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

