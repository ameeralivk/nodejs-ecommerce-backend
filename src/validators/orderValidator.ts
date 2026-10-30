import { z } from 'zod';
import { objectId } from './common';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product: objectId('Each item needs a valid product id'),
        quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
      }),
      { error: 'Order must contain at least one item' }
    )
    .min(1, 'Order must contain at least one item'),
});

export const updateOrderStatusSchema = z.object({
  status: z.string({ error: 'Status is required' }).min(1, 'Status is required'),
});
