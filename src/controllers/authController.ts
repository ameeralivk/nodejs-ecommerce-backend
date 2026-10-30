import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import * as authService from '../services/authService';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.register(name, email, password);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { user } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token missing');

  const { user, accessToken, refreshToken } = await authService.refreshAccessToken(token);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ success: true, data: { user } });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out' });
});
