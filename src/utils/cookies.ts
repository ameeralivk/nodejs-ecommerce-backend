import { Response } from 'express';
import { ACCESS_TOKEN_MAX_AGE_MS, REFRESH_TOKEN_MAX_AGE_MS } from './jwt';

const isProd = process.env.NODE_ENV === 'production';

const baseOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie('accessToken', accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });

  // Scoped to /api/auth so it is only ever sent to the refresh/logout endpoints.
  res.cookie('refreshToken', refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/api/auth',
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken', baseOptions);
  res.clearCookie('refreshToken', { ...baseOptions, path: '/api/auth' });
};
