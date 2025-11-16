import { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from 'src/utils/cloudinary';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
      allowEmptyFiles: false,
    });
    
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Uploading file:', file.originalFilename, 'Size:', file.size);

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.filepath, {
      folder: 'clip-art',
      resource_type: 'image',
      quality: 'auto:best',
    });

    console.log('Cloudinary upload successful:', result.public_id);

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch (e) {
      // Ignore cleanup errors
    }

    return res.status(200).json({
      cloudinary_public_id: result.public_id,
      cloudinary_url: result.url,
      cloudinary_secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload to Cloudinary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

