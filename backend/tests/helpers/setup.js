import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import authRoutes from '../../routes/auth.js';
import entryRoutes from '../../routes/entries.js';
import adminRoutes from '../../routes/admin.js';

let mongoServer;

process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.FRONTEND_URL = 'http://localhost:5174';
process.env.BACKEND_URL = 'http://localhost:5001';
process.env.RESEND_API_KEY = 're_test';
process.env.EMAIL_FROM = 'test@test.com';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';

export async function connectDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function closeDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/entries', entryRoutes);
  app.use('/api/admin', adminRoutes);
  return app;
}

export function getApp() {
  return createApp();
}

export async function createTestUser(overrides = {}) {
  const data = {
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    phone: '+1234567890',
    dob: new Date('1990-01-01'),
    password: 'Password123!',
    isVerified: true,
    ...overrides,
  };

  return User.create(data);
}

export async function createTestAdmin(overrides = {}) {
  const data = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin',
    isVerified: true,
    ...overrides,
  };

  return User.create(data);
}

export function getTokenForUser(user) {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  if (user.role) {
    payload.role = user.role;
    payload.avatar = user.avatar || null;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function getAuthHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await closeDB();
});

beforeEach(async () => {
  await clearDB();
});
