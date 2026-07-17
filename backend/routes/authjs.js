import express from 'express';
import { Auth } from '@auth/core';
import { authConfig } from '../lib/authjs.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/exchange-token', (req, res) => {
  const token = req.cookies?.['authjs.session-token'];
  if (!token) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
  } catch {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

router.all('*', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = new URL(req.originalUrl, baseUrl);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body);

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    const authResponse = await Auth(request, authConfig);

    res.status(authResponse.status);

    for (const [key, value] of authResponse.headers.entries()) {
      if (key.toLowerCase() !== 'set-cookie') {
        res.setHeader(key, value);
      }
    }

    try {
      const cookies = authResponse.headers.getSetCookie();
      cookies.forEach((cookie) => {
        res.append('Set-Cookie', cookie);
      });
    } catch {
      const combined = authResponse.headers.get('set-cookie');
      if (combined) {
        combined.split(', ').forEach((cookie) => {
          res.append('Set-Cookie', cookie);
        });
      }
    }

    const text = await authResponse.text();
    res.send(text);
  } catch (error) {
    console.error('Auth.js error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

export default router;
