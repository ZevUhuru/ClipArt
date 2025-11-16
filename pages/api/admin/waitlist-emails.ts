import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../db/index';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check - you should implement proper auth
  // For now, checking for a secret key in the query params
  const { secret } = req.query;
  
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const query = `
      SELECT 
        id,
        email,
        source,
        subscribed_at,
        unsubscribed
      FROM email_waitlist
      WHERE unsubscribed = false
      ORDER BY subscribed_at DESC
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      emails: result.rows,
    });

  } catch (error) {
    console.error('Error fetching waitlist emails:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch emails',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

