import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { prisma } from '../lib/prisma';

export type AuthRequest = Request & {
  user?: { id: string; role: string; email: string };
};

export async function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Token não informado');
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.blocked) {
      throw new AppError(401, 'Sessão inválida ou usuário bloqueado');
    }
    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (e) {
    if (e instanceof AppError) return next(e);
    return next(new AppError(401, 'Token inválido ou expirado'));
  }
}

export async function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && !user.blocked) {
      req.user = { id: user.id, role: user.role, email: user.email };
    }
  } catch {
    // token inválido: segue sem usuário
  }
  next();
}
