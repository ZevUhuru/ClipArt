import type { NextApiRequest, NextApiResponse } from 'next';
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin secret
  const secret = req.query.secret as string;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();

  try {
    // 1. Total downloads
    const totalDownloads = await client.query(`
      SELECT COUNT(*) as count FROM downloads_by_url
    `);

    // 2. Downloads by category
    const downloadsByCategory = await client.query(`
      SELECT 
        category,
        COUNT(*) as download_count,
        COUNT(DISTINCT email) as unique_users
      FROM downloads_by_url
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY download_count DESC
    `);

    // 3. Most downloaded images
    const mostDownloaded = await client.query(`
      SELECT 
        image_url,
        image_title,
        category,
        COUNT(*) as download_count,
        COUNT(DISTINCT email) as unique_downloaders,
        MAX(downloaded_at) as last_downloaded
      FROM downloads_by_url
      GROUP BY image_url, image_title, category
      ORDER BY download_count DESC
      LIMIT 50
    `);

    // 4. Downloads over time (last 30 days)
    const downloadsOverTime = await client.query(`
      SELECT 
        DATE(downloaded_at) as date,
        COUNT(*) as download_count,
        COUNT(DISTINCT email) as unique_users
      FROM downloads_by_url
      WHERE downloaded_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(downloaded_at)
      ORDER BY date DESC
    `);

    // 5. Downloads today, this week, this month
    const recentStats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE downloaded_at >= CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE downloaded_at >= CURRENT_DATE - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE downloaded_at >= CURRENT_DATE - INTERVAL '30 days') as this_month,
        COUNT(DISTINCT email) FILTER (WHERE downloaded_at >= CURRENT_DATE) as unique_today,
        COUNT(DISTINCT email) FILTER (WHERE downloaded_at >= CURRENT_DATE - INTERVAL '7 days') as unique_week,
        COUNT(DISTINCT email) FILTER (WHERE downloaded_at >= CURRENT_DATE - INTERVAL '30 days') as unique_month
      FROM downloads_by_url
    `);

    // 6. Top download sources (from email waitlist source field)
    const topSources = await client.query(`
      SELECT 
        source,
        COUNT(*) as download_count
      FROM downloads_by_url
      WHERE email IN (
        SELECT email FROM email_waitlist WHERE source LIKE 'download-%'
      )
      GROUP BY source
      ORDER BY download_count DESC
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      data: {
        totalDownloads: parseInt(totalDownloads.rows[0]?.count || '0'),
        downloadsByCategory: downloadsByCategory.rows,
        mostDownloaded: mostDownloaded.rows,
        downloadsOverTime: downloadsOverTime.rows,
        recentStats: recentStats.rows[0] || {},
        topSources: topSources.rows,
      },
    });
  } catch (error: any) {
    console.error('Download stats error:', error);
    res.status(500).json({ error: 'Failed to fetch download stats' });
  } finally {
    client.release();
  }
}

