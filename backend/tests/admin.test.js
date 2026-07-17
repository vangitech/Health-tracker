import request from 'supertest';
import mongoose from 'mongoose';
import { getApp, createTestUser, createTestAdmin, getTokenForUser } from './helpers/setup.js';
import BloodSugarEntry from '../models/BloodSugarEntry.js';

const app = getApp();

describe('POST /api/admin/login', () => {
  const password = 'AdminPass123!';

  beforeEach(async () => {
    await createTestAdmin({ email: 'admin@example.com', password });
  });

  it('logs in admin with valid credentials', async () => {
    const res = await request(app).post('/api/admin/login').send({ email: 'admin@example.com', password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'admin@example.com', password: 'WrongPass123!' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for patient login attempt', async () => {
    await createTestUser({
      email: 'patient@example.com',
      password: 'Password123!',
      isVerified: true,
    });
    const res = await request(app)
      .post('/api/admin/login')
      .send({ email: 'patient@example.com', password: 'Password123!' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Admin access required');
  });

  it('sets httpOnly cookie on success', async () => {
    const res = await request(app).post('/api/admin/login').send({ email: 'admin@example.com', password });
    const cookies = res.headers['set-cookie'];
    expect(cookies.some((c) => c.startsWith('token='))).toBe(true);
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });
});

describe('GET /api/admin/profile', () => {
  it('returns admin profile', async () => {
    const admin = await createTestAdmin({ email: 'admin@example.com' });
    const token = getTokenForUser(admin);
    const res = await request(app).get('/api/admin/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@example.com');
    expect(res.body.role).toBe('admin');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/profile');
    expect(res.status).toBe(401);
  });

  it('returns 403 for patient token', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const res = await request(app).get('/api/admin/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/patients', () => {
  it('returns patient list for admin', async () => {
    const admin = await createTestAdmin({ email: 'admin@example.com' });
    const token = getTokenForUser(admin);
    await createTestUser({ email: 'patient1@example.com', isVerified: true });
    await createTestUser({ email: 'patient2@example.com', isVerified: true });

    const res = await request(app).get('/api/admin/patients').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.patients).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it('returns patient list with entries', async () => {
    const admin = await createTestAdmin({ email: 'admin@example.com' });
    const token = getTokenForUser(admin);
    const user = await createTestUser({ email: 'patient@example.com', isVerified: true });
    await BloodSugarEntry.create({
      userId: user._id,
      date: '2024-01-15',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
    });

    const res = await request(app).get('/api/admin/patients').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.patients[0].latestReading).toBe(5.5);
  });

  it('returns 403 for patient token', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const res = await request(app).get('/api/admin/patients').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/analytics', () => {
  it('returns analytics for admin', async () => {
    const admin = await createTestAdmin({ email: 'admin@example.com' });
    const token = getTokenForUser(admin);
    const user = await createTestUser({ email: 'patient@example.com', isVerified: true });
    await BloodSugarEntry.create({
      userId: user._id,
      date: new Date(),
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
    });

    const res = await request(app).get('/api/admin/analytics').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalPatients).toBe(1);
    expect(res.body.totalEntries).toBe(1);
    expect(res.body.activeToday).toBe(1);
  });
});

describe('POST /api/admin/logout', () => {
  it('clears the token cookie', async () => {
    const res = await request(app).post('/api/admin/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies.some((c) => c.includes('token=;'))).toBe(true);
  });
});
