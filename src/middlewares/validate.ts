import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import ApiError from '../utils/ApiError';

const validate = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    return next(new ApiError(400, message));
  }
  req.body = result.data;
  next();
};

export default validate;
