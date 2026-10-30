import ApiError from '../utils/ApiError';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthResult } from '../types/auth.types';

export const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const user = await User.create({ name, email, password, role: 'customer' });
  return { user, accessToken: generateAccessToken(user), refreshToken: generateRefreshToken(user) };
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');

  return { user, accessToken: generateAccessToken(user), refreshToken: generateRefreshToken(user) };
};

export const refreshAccessToken = async (refreshToken: string): Promise<AuthResult> => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  return { user, accessToken: generateAccessToken(user), refreshToken: generateRefreshToken(user) };
};
