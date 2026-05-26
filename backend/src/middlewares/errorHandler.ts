import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const msg = err.errors.map((e) => e.message).join(', ');
    return res.status(400).json({ success: false, message: msg, code: 'VALIDATION_ERROR' });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
  if (err instanceof Error) {
    logger.error('unhandled_error', { message: err.message, stack: err.stack });
  } else {
    logger.error('unhandled_unknown_error', {});
  }
  return res.status(500).json({
    success: false,
    message: 'Algo deu errado. Tente novamente em instantes.',
  });
}
