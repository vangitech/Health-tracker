// server/index.js
import 'dotenv/config';

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `\n❌ Missing required environment variables:\n   ${missing.join('\n   ')}\n\n` +
      '   See backend/.env.example for the full list.\n'
  );
  process.exit(1);
}

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import authjsRoutes from './routes/authjs.js';
import { authConfig } from './lib/authjs.js';
import entryRoutes from './routes/entries.js';
import trendRoutes from './routes/trends.js';
import adminRoutes from './routes/admin.js';
import appointmentRoutes from './routes/appointments.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

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
  'http://127.0.0.1:5001',
];

app.use(
  cors({
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
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

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

// Serve uploaded files (legacy - kept for any previously uploaded local files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Apple: /api/auth/apple/callback → (POST) /api/auth/callback/apple
app.post('/api/auth/apple/callback', (req, res) => {
  const search = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect(307, `/api/auth/callback/apple${search}`);
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', authjsRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
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
      trends: '/api/trends',
    },
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
    const email = 'supadmin@vangitech.online';
    const existing = await User.findOne({ email });
    if (!existing) {
      await new User({
        firstName: 'Super',
        lastName: 'Admin',
        email,
        password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@12345',
        role: 'superadmin',
        isVerified: true,
      }).save();
      console.log('  ✅ Super admin seeded (supadmin@vangitech.online)');
    }
    // Migrate existing users missing role field
    const migrated = await User.updateMany({ role: { $exists: false } }, { $set: { role: 'patient' } });
    if (migrated.modifiedCount > 0) {
      console.log(`  ✅ Migrated ${migrated.modifiedCount} user(s) to role: patient`);
    }
  } catch (err) {
    console.error('  ❌ Seed/migration error:', err.message);
  }
}
seedAndMigrate();

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Server running on port ${PORT}`);
  console.log(`========================================`);
  const base = `http://localhost:${PORT}`;
  console.log(`\n📌 Auth.js callback URLs for OAuth providers:`);
  authConfig.providers.forEach((p) => {
    console.log(`   ${p.name}: ${base}/api/auth/callback/${p.id}`);
  });
  console.log(`\n📌 Add these URLs to your OAuth provider settings:`);
  authConfig.providers.forEach((p) => {
    console.log(`   ${p.name}: ${base}/api/auth/callback/${p.id}`);
  });
  console.log(`\n📌 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}\n`);

  // Cron job: ping Render every 10 minutes to prevent spin-down
  const RENDER_URL = process.env.RENDER_URL || 'https://health-tracker-14dn.onrender.com';
  async function keepAlive() {
    try {
      const res = await fetch(RENDER_URL);
      console.log(`[Keep-Alive] Pinged ${RENDER_URL} — ${res.status}`);
    } catch (err) {
      console.error(`[Keep-Alive] Failed to ping ${RENDER_URL}:`, err.message);
    }
    setTimeout(keepAlive, 10 * 60 * 1000);
  }
  keepAlive();
});
