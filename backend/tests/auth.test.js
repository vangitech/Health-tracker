import request from 'supertest';
import { getApp, createTestUser, getTokenForUser } from './helpers/setup.js';
import User from '../models/User.js';

const app = getApp();

describe('POST /api/auth/register', () => {
  const validPayload = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    dob: '1990-01-01',
    password: 'Password123!',
  };

  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.message).toContain('User created');
    expect(res.body.email).toBe('john@example.com');
  });

  it('returns 400 for duplicate email', async () => {
    await createTestUser({ email: 'john@example.com', _skipHash: true });
    const res = await request(app).post('/api/auth/register').send(validPayload);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already exists');
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validPayload, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const password = 'Password123!';

  beforeEach(async () => {
    await createTestUser({
      email: 'login@example.com',
      password,
      isVerified: true,
    });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPass123!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid');
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unverified email', async () => {
    await createTestUser({
      email: 'unverified@example.com',
      password,
      isVerified: false,
      _skipHash: true,
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'unverified@example.com', password });
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('verify');
  });

  it('sets httpOnly cookie on success', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password });
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('token='))).toBe(true);
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });
});

describe('POST /api/auth/verify', () => {
  const email = 'verify@example.com';
  const password = 'Password123!';

  beforeEach(async () => {
    await createTestUser({
      email,
      password,
      isVerified: false,
    });
    const VerificationCode = (await import('../models/VerificationCode.js')).default;
    await VerificationCode.create({
      email,
      code: '123456',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
  });

  it('verifies email with correct code', async () => {
    const res = await request(app).post('/api/auth/verify').send({ email, code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('verified');
    expect(res.body.token).toBeDefined();
    const user = await User.findOne({ email });
    expect(user.isVerified).toBe(true);
  });

  it('returns 400 for invalid code', async () => {
    const res = await request(app).post('/api/auth/verify').send({ email, code: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid');
  });
});

describe('POST /api/auth/resend-code', () => {
  it('returns 404 for non-existent user', async () => {
    const res = await request(app).post('/api/auth/resend-code').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(404);
  });

  it('returns 400 if already verified', async () => {
    await createTestUser({ email: 'verified@example.com', isVerified: true });
    const res = await request(app).post('/api/auth/resend-code').send({ email: 'verified@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already verified');
  });
});

describe('GET /api/auth/me', () => {
  it('returns user profile with valid token', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 403 with invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the token cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('token=;'))).toBe(true);
  });
});
