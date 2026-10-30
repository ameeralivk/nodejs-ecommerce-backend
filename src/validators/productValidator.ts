import { z } from 'zod';
import { objectId } from './common';

export const createProductSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required'),
  sku: z.string({ error: 'SKU is required' }).trim().min(1, 'SKU is required'),
  description: z.string().optional(),
  price: z.coerce.number({ error: 'Price must be a positive number' }).min(0, 'Price must be a positive number'),
  salePrice: z.coerce.number().min(0, 'Sale price must be a positive number').nullable().optional(),
  stock: z.coerce
    .number({ error: 'Stock must be a non-negative integer' })
    .int('Stock must be a non-negative integer')
    .min(0, 'Stock must be a non-negative integer'),
  category: objectId('A valid category id is required'),
  status: z.enum(['active', 'inactive'], { error: 'Status must be active or inactive' }).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  sku: z.string().trim().min(1, 'SKU cannot be empty').optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number').optional(),
  salePrice: z.coerce.number().min(0, 'Sale price must be a positive number').nullable().optional(),
  stock: z.coerce
    .number()
    .int('Stock must be a non-negative integer')
    .min(0, 'Stock must be a non-negative integer')
    .optional(),
  category: objectId('A valid category id is required').optional(),
  status: z.enum(['active', 'inactive'], { error: 'Status must be active or inactive' }).optional(),
});
