import request from 'supertest';
import mongoose from 'mongoose';
import { getApp, createTestUser, getTokenForUser } from './helpers/setup.js';
import BloodSugarEntry from '../models/BloodSugarEntry.js';

const app = getApp();

describe('GET /api/entries', () => {
  it('returns empty array when user has no entries', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const res = await request(app).get('/api/entries').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns entries scoped to the authenticated user', async () => {
    const user = await createTestUser({ isVerified: true });
    const otherUser = await createTestUser({
      email: 'other@example.com',
      isVerified: true,
    });
    await BloodSugarEntry.create([
      { userId: user._id, date: '2024-01-15', time: '09:00', glucoseValue: 5.5, mealType: 'breakfast' },
      { userId: otherUser._id, date: '2024-01-15', time: '10:00', glucoseValue: 7.2, mealType: 'breakfast' },
    ]);
    const token = getTokenForUser(user);
    const res = await request(app).get('/api/entries').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].glucoseValue).toBe(5.5);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/entries');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/entries', () => {
  it('creates a new entry', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const res = await request(app).post('/api/entries').set('Authorization', `Bearer ${token}`).send({
      date: '2024-01-15',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
      foodEaten: 'Oatmeal',
      carbs: 30,
      insulinUnits: 5,
      notes: 'Good morning',
    });
    expect(res.status).toBe(201);
    expect(res.body.glucoseValue).toBe(5.5);
    expect(res.body.userId).toBe(user._id.toString());
  });

  it('returns 400 for invalid glucose value', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const res = await request(app)
      .post('/api/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2024-01-15', time: '09:00', glucoseValue: 999, mealType: 'breakfast' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid mealType', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const res = await request(app)
      .post('/api/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2024-01-15', time: '09:00', glucoseValue: 5.5, mealType: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/entries')
      .send({ date: '2024-01-15', time: '09:00', glucoseValue: 5.5, mealType: 'breakfast' });
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/entries/:id', () => {
  it('updates only allowed fields', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const entry = await BloodSugarEntry.create({
      userId: user._id,
      date: '2024-01-15',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
      foodEaten: 'Oatmeal',
    });

    const res = await request(app)
      .put(`/api/entries/${entry._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ glucoseValue: 6.0, foodEaten: 'Pancakes', userId: new mongoose.Types.ObjectId().toString() });

    expect(res.status).toBe(200);
    expect(res.body.glucoseValue).toBe(6.0);
    expect(res.body.foodEaten).toBe('Pancakes');
    expect(res.body.userId).toBe(user._id.toString());
  });

  it('returns 404 for non-existent entry', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/entries/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ glucoseValue: 6.0 });
    expect(res.status).toBe(404);
  });

  it('returns 404 for another user entry', async () => {
    const user = await createTestUser({ isVerified: true });
    const otherUser = await createTestUser({ email: 'other@example.com', isVerified: true });
    const token = getTokenForUser(user);
    const entry = await BloodSugarEntry.create({
      userId: otherUser._id,
      date: '2024-01-15',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
    });

    const res = await request(app)
      .put(`/api/entries/${entry._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ glucoseValue: 6.0 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/entries/:id', () => {
  it('deletes own entry', async () => {
    const user = await createTestUser({ isVerified: true });
    const token = getTokenForUser(user);
    const entry = await BloodSugarEntry.create({
      userId: user._id,
      date: '2024-01-15',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
    });

    const res = await request(app).delete(`/api/entries/${entry._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const deleted = await BloodSugarEntry.findById(entry._id);
    expect(deleted).toBeNull();
  });

  it('returns 404 for another users entry', async () => {
    const user = await createTestUser({ isVerified: true });
    const otherUser = await createTestUser({ email: 'other@example.com', isVerified: true });
    const token = getTokenForUser(user);
    const entry = await BloodSugarEntry.create({
      userId: otherUser._id,
      date: '2024-01-15',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
    });

    const res = await request(app).delete(`/api/entries/${entry._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
