import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt';
import { IUser } from '../../src/types/user.types';

const fakeUser = (role: 'admin' | 'customer' = 'customer') =>
  ({ _id: new mongoose.Types.ObjectId(), role } as unknown as IUser);

describe('jwt utils', () => {
  it('round-trips an access token with the same id and role', () => {
    const user = fakeUser('admin');
    const token = generateAccessToken(user);
    const decoded = verifyAccessToken(token);

    expect(decoded.id).toBe(String(user._id));
    expect(decoded.role).toBe('admin');
  });

  it('round-trips a refresh token with the same id and role', () => {
    const user = fakeUser('customer');
    const token = generateRefreshToken(user);
    const decoded = verifyRefreshToken(token);

    expect(decoded.id).toBe(String(user._id));
    expect(decoded.role).toBe('customer');
  });

  it('rejects an access token verified as a refresh token (separate secrets)', () => {
    const token = generateAccessToken(fakeUser());
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('rejects a refresh token verified as an access token (separate secrets)', () => {
    const token = generateRefreshToken(fakeUser());
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
