import { z } from 'zod';

export const updateMeSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email('A valid email is required').optional(),
});

export const setUserStatusSchema = z.object({
  isActive: z.boolean({ error: 'isActive must be true or false' }),
});
