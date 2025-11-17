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
    const result = await pool.query(query, values);

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

