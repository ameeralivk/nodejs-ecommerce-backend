import request from 'supertest';
import app from '../src/app';
import User from '../src/models/User';

const uniqueEmail = () => `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;

export const createAgent = () => request.agent(app);

export const registerCustomer = async (
  agent: ReturnType<typeof createAgent>,
  overrides: Partial<{ name: string; email: string; password: string }> = {}
) => {
  const payload = {
    name: overrides.name || 'Test Customer',
    email: overrides.email || uniqueEmail(),
    password: overrides.password || 'password123',
  };
  const res = await agent.post('/api/auth/register').send(payload);
  return { user: res.body.data.user, password: payload.password, response: res };
};

export const registerAdmin = async (
  agent: ReturnType<typeof createAgent>,
  overrides: Partial<{ name: string; email: string; password: string }> = {}
) => {
  const { user, password } = await registerCustomer(agent, overrides);
  // protect() re-fetches the user from the DB on every request, so promoting
  // the role here takes effect on the agent's next call without re-login.
  await User.updateOne({ _id: user._id }, { role: 'admin' });
  return { user, password };
};
