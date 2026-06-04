import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

const newUser = () => ({
  email: `u${Date.now()}${Math.random().toString(36).slice(2, 6)}@test.dev`,
  password: 'supersecret1',
  fullName: 'Test User',
  organizationName: 'Test Org',
});

describe('POST /api/auth/signup', () => {
  it('creates a user and returns tokens', async () => {
    const u = newUser();
    const res = await request(app).post('/api/auth/signup').send(u);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(u.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.refreshToken).toBeTypeOf('string');
  });

  it('rejects duplicate email', async () => {
    const u = newUser();
    await request(app).post('/api/auth/signup').send(u).expect(201);
    const res = await request(app).post('/api/auth/signup').send(u);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...newUser(), password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });
});

describe('POST /api/auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    const u = newUser();
    await request(app).post('/api/auth/signup').send(u).expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: u.email, password: u.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
  });

  it('rejects invalid password', async () => {
    const u = newUser();
    await request(app).post('/api/auth/signup').send(u).expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: u.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authed user', async () => {
    const u = newUser();
    const signupRes = await request(app).post('/api/auth/signup').send(u);
    const token = signupRes.body.accessToken as string;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(u.email);
  });

  it('rejects without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotates tokens', async () => {
    const u = newUser();
    const signup = await request(app).post('/api/auth/signup').send(u);
    const refresh = signup.body.refreshToken as string;
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: refresh });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.refreshToken).not.toBe(refresh);
    // Old refresh token should now be rejected
    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: refresh });
    expect(reuse.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the refresh token', async () => {
    const u = newUser();
    const signup = await request(app).post('/api/auth/signup').send(u);
    const refreshToken = signup.body.refreshToken as string;
    await request(app).post('/api/auth/logout').send({ refreshToken }).expect(204);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('always returns ok (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@test.dev' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
