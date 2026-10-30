import { z } from 'zod';
import { objectId } from './common';

export const createCategorySchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required'),
  parent: objectId('Invalid parent category id').nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  parent: objectId('Invalid parent category id').nullable().optional(),
});
