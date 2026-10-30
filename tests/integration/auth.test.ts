import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/User';
import { createAgent, registerCustomer } from '../helpers';

describe('auth flow', () => {
  it('registers a user, sets httpOnly auth cookies, and omits the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('alice@test.com');
    expect(res.body.data.user.password).toBeUndefined();

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('accessToken=') && c.includes('HttpOnly'))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refreshToken=') && c.includes('HttpOnly'))).toBe(true);
  });

  it('rejects registering the same email twice', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob 2', email: 'bob@test.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('rejects login with the wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carl', email: 'carl@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carl@test.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('blocks access to a protected route without a cookie, allows it with one', async () => {
    const noAuth = await request(app).get('/api/users/me');
    expect(noAuth.status).toBe(401);

    const agent = createAgent();
    const { user } = await registerCustomer(agent);

    const authed = await agent.get('/api/users/me');
    expect(authed.status).toBe(200);
    expect(authed.body.data.email).toBe(user.email);
  });

  it('issues a new token pair from /auth/refresh and rejects a missing refresh cookie', async () => {
    const agent = createAgent();
    await registerCustomer(agent);

    const refreshed = await agent.post('/api/auth/refresh');
    expect(refreshed.status).toBe(200);

    const freshAgent = createAgent();
    const noRefresh = await freshAgent.post('/api/auth/refresh');
    expect(noRefresh.status).toBe(401);
  });

  it('logs out and revokes cookie-based access', async () => {
    const agent = createAgent();
    await registerCustomer(agent);

    expect((await agent.get('/api/users/me')).status).toBe(200);
    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/users/me')).status).toBe(401);
  });

  it('rejects requests from a deactivated account even with a still-valid cookie', async () => {
    const agent = createAgent();
    const { user } = await registerCustomer(agent);

    await User.updateOne({ _id: user._id }, { isActive: false });

    const res = await agent.get('/api/users/me');
    expect(res.status).toBe(403);
  });
});
