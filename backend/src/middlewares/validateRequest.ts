import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';
import { AppError } from '../utils/AppError';

type Schema = AnyZodObject | ZodEffects<AnyZodObject, unknown, unknown>;

export function validateBody(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(', ');
      return next(new AppError(400, msg, 'VALIDATION_ERROR'));
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(', ');
      return next(new AppError(400, msg, 'VALIDATION_ERROR'));
    }
    req.query = parsed.data as Request['query'];
    next();
  };
}
