import { NextApiRequest, NextApiResponse } from 'next';
import pool from 'db';
import typesenseClient from 'src/utils/typesense';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - List all images
  if (req.method === 'GET') {
    try {
      const { published, category, limit = 50, offset = 0 } = req.query;
      
      let query = 'SELECT * FROM images';
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (published !== undefined) {
        conditions.push(`published = $${paramIndex++}`);
        params.push(published === 'true');
      }

      if (category) {
        conditions.push(`category = $${paramIndex++}`);
        params.push(category);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(Number(limit), Number(offset));

      const result = await pool.query(query, params);

      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('Error fetching images:', error);
      return res.status(500).json({ error: 'Failed to fetch images' });
    }
  }

  // POST - Create new image
  if (req.method === 'POST') {
    try {
      const {
        cloudinary_public_id,
        cloudinary_url,
        cloudinary_secure_url,
        width,
        height,
        format,
        bytes,
        title,
        description,
        alt_text,
        tags,
        category,
        published,
        scheduled_for,
      } = req.body;

      if (!cloudinary_public_id || !title) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const seo_slug = generateSlug(title);
      const published_at = published ? new Date() : null;

      // 1. Save to PostgreSQL (source of truth)
      const query = `
        INSERT INTO images (
          cloudinary_public_id, cloudinary_url, cloudinary_secure_url,
          title, description, alt_text, tags, category,
          file_format, width, height, file_size,
          seo_slug, published, published_at, scheduled_for
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const values = [
        cloudinary_public_id,
        cloudinary_url,
        cloudinary_secure_url,
        title,
        description || null,
        alt_text || null,
        tags || [],
        category || null,
        format,
        width,
        height,
        bytes,
        seo_slug,
        published,
        published_at,
        scheduled_for || null,
      ];

      const result = await pool.query(query, values);
      const image = result.rows[0];

      console.log('✅ Image saved to PostgreSQL:', image.id);

      // 2. Sync to Typesense (search index)
      if (published) {
        try {
          await typesenseClient.collections('clip_art_collection').documents().upsert({
            id: image.id,
            title: image.title,
            description: image.description || '',
            tags: Array.isArray(image.tags) ? image.tags.join(', ') : '',
            category: image.category || '',
            image_url: image.cloudinary_secure_url,
            creation_timestamp: Math.floor(new Date(image.created_at).getTime() / 1000),
          });
          console.log('✅ Image synced to Typesense');
        } catch (typesenseError) {
          console.error('⚠️ Typesense sync failed (non-fatal):', typesenseError);
          // Don't fail the request - PostgreSQL is source of truth
        }
      }

      return res.status(201).json({
        success: true,
        data: image,
      });
    } catch (error) {
      console.error('Error creating image:', error);
      return res.status(500).json({ 
        error: 'Failed to create image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT - Update image
  if (req.method === 'PUT') {
    try {
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Image ID required' });
      }

      const allowedFields = [
        'title', 'description', 'alt_text', 'tags', 'category',
        'published', 'scheduled_for'
      ];

      const setClause: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.keys(updates).forEach((key) => {
        if (allowedFields.includes(key)) {
          setClause.push(`${key} = $${paramIndex++}`);
          values.push(updates[key]);
        }
      });

      if (setClause.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      values.push(id);
      const query = `
        UPDATE images 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const image = result.rows[0];

      // Update in Typesense if published
      if (image.published) {
        try {
          await typesenseClient.collections('clip_art_collection').documents(image.id).update({
            title: image.title,
            description: image.description || '',
            tags: (image.tags || []).join(', '),
            category: image.category || '',
          });
        } catch (typesenseError) {
          console.error('Failed to update Typesense:', typesenseError);
        }
      }

      return res.status(200).json({
        success: true,
        data: image,
      });
    } catch (error) {
      console.error('Error updating image:', error);
      return res.status(500).json({ error: 'Failed to update image' });
    }
  }

  // DELETE - Delete image
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Image ID required' });
      }

      // Get image details before deleting
      const imageResult = await pool.query('SELECT * FROM images WHERE id = $1', [id]);
      
      if (imageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const image = imageResult.rows[0];

      // Delete from database
      await pool.query('DELETE FROM images WHERE id = $1', [id]);

      // Delete from Typesense
      try {
        await typesenseClient.collections('clip_art_collection').documents(id).delete();
      } catch (typesenseError) {
        console.error('Failed to delete from Typesense:', typesenseError);
      }

      // Optionally delete from Cloudinary
      // await cloudinary.v2.uploader.destroy(image.cloudinary_public_id);

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      return res.status(500).json({ error: 'Failed to delete image' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

