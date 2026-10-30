import { z } from 'zod';

export const objectId = (message = 'Invalid id') =>
  z.string({ error: message }).regex(/^[0-9a-fA-F]{24}$/, message);
