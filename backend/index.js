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

// Old OAuth callback URL compatibility routes
// Must be before authjsRoutes to avoid Auth.js catch-all
// Google: /api/auth/google/callback → /api/auth/callback/google
app.get('/api/auth/google/callback', (req, res) => {
  const search = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
  res.redirect(307, `/api/auth/callback/google${search}`)
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