// server/index.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import authjsRoutes from './routes/authjs.js';
import { authConfig } from './lib/authjs.js';
import entryRoutes from './routes/entries.js';
import trendRoutes from './routes/trends.js';
import adminRoutes from './routes/admin.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS Configuration - Allow multiple frontend URLs
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://health-tracker-one-jade.vercel.app',
  'https://health-tracker-one-jade.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://localhost:5001',
  'http://127.0.0.1:5001'
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('capacitor://') ||
      origin.startsWith('file://')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable CORS preflight for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve uploaded files (legacy - kept for any previously uploaded local files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// OAuth callback handler at old URL for Google (registered in Google Cloud Console)
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error: authError } = req.query
  if (authError || !code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`)
  }
  try {
    // Exchange authorization code for tokens via Google's API
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenResp.json()
    if (!tokens.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`)
    }
    // Fetch user profile from Google
    const profileResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileResp.json()
    if (!profile.email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`)
    }
    // Find or create user in MongoDB
    let user = await User.findOne({ provider: 'google', providerId: profile.id })
    if (!user) {
      user = await User.findOne({ email: profile.email })
      if (user) {
        user.provider = 'google'
        user.providerId = profile.id
        user.isVerified = true
        if (profile.picture && !user.avatar) user.avatar = profile.picture
        await user.save()
      } else {
        user = await new User({
          firstName: profile.given_name || profile.name?.split(' ')[0] || 'Google',
          lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'User',
          email: profile.email,
          provider: 'google',
          providerId: profile.id,
          isVerified: true,
          avatar: profile.picture,
        }).save()
      }
    }
    // Sign application JWT (matching existing auth flow)
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`)
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`)
  }
})
// Apple: /api/auth/apple/callback → (POST) /api/auth/callback/apple
app.post('/api/auth/apple/callback', (req, res) => {
  const search = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
  res.redirect(307, `/api/auth/callback/apple${search}`)
})
// Yahoo still handled by old Passport routes if mounted

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', authjsRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API test endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Blood Sugar Tracker API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      entries: '/api/entries',
      trends: '/api/trends'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== UNHANDLED ERROR ===');
  console.error('URL:', req?.method, req?.originalUrl);
  console.error('Error:', err);
  console.error('Message:', err?.message);
  console.error('Stack:', err?.stack);
  const status = err.status || 500;
  res.status(status).json({ message: err?.message || 'Something went wrong!' });
});

// Seed super admin + migrate existing users without role
async function seedAndMigrate() {
  try {
    const email = 'supadmin@vangitech.online'
    const existing = await User.findOne({ email })
    if (!existing) {
      await new User({
        firstName: 'Super',
        lastName: 'Admin',
        email,
        password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@12345',
        role: 'superadmin',
        isVerified: true,
      }).save()
      console.log('  ✅ Super admin seeded (supadmin@vangitech.online)')
    }
    // Migrate existing users missing role field
    const migrated = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'patient' } }
    )
    if (migrated.modifiedCount > 0) {
      console.log(`  ✅ Migrated ${migrated.modifiedCount} user(s) to role: patient`)
    }
  } catch (err) {
    console.error('  ❌ Seed/migration error:', err.message)
  }
}
seedAndMigrate()

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Server running on port ${PORT}`);
  console.log(`========================================`);
  const base = `http://localhost:${PORT}`;
  console.log(`\n📌 Auth.js callback URLs for OAuth providers:`);
  authConfig.providers.forEach(p => {
    console.log(`   ${p.name}: ${base}/api/auth/callback/${p.id}`);
  });
  console.log(`\n📌 Add these URLs to your OAuth provider settings:`);
  authConfig.providers.forEach(p => {
    console.log(`   ${p.name}: ${base}/api/auth/callback/${p.id}`);
  });
  console.log(`\n📌 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}\n`);
});