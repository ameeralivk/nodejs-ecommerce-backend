import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required'),
  email: z.string({ error: 'A valid email is required' }).email('A valid email is required'),
  password: z
    .string({ error: 'Password must be at least 6 characters' })
    .min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string({ error: 'A valid email is required' }).email('A valid email is required'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});
