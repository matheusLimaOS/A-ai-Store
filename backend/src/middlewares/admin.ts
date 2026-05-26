import { NextFunction, Response } from 'express';
import { AppError } from '../utils/AppError';
import { AuthRequest } from './auth';
import { Role } from '@prisma/client';

export function adminMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError(401, 'Não autenticado'));
  }
  if (req.user.role !== Role.ADMIN) {
    return next(new AppError(403, 'Acesso restrito a administradores'));
  }
  next();
}
