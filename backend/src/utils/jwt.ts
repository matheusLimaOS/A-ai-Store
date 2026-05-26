import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

export type AccessPayload = {
  sub: string;
  role: Role;
  email: string;
};

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(
    { role: payload.role, email: payload.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES, subject: payload.sub } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & {
    role: Role;
    email: string;
  };
  return { sub: decoded.sub!, role: decoded.role, email: decoded.email };
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({}, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    subject: userId,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { sub: string } {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  return { sub: decoded.sub! };
}
