import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminPassword, createAdminToken } from 'src/utils/auth';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Verify password
  if (!verifyAdminPassword(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  try {
    // Create JWT token
    const token = await createAdminToken('admin');

    // Set cookie
    const cookie = serialize('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ 
      success: true,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


