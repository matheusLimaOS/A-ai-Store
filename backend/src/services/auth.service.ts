import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { userRepo } from '../repositories/user.repository';
import { refreshTokenRepo } from '../repositories/refreshToken.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';
import { randomToken } from '../utils/crypto';
import { logger } from '../config/logger';

function parseJwtExpiryToMs(exp: string): number {
  const m = /^(\d+)([smhd])$/i.exec(exp.trim());
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const mult = u === 's' ? 1000 : u === 'm' ? 60_000 : u === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

export const authService = {
  async register(input: { email: string; password: string; name: string; phone?: string }) {
    const exists = await userRepo.findByEmail(input.email);
    if (exists) throw new AppError(409, 'E-mail já cadastrado');
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userRepo.create({
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      phone: input.phone,
      role: Role.USER,
    });
    return this.issueTokens(user.id, user.role, user.email);
  },

  async login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();
    const user = await userRepo.findByEmail(email);
    if (!user) {
      logger.warn('auth_login_failed', { email, reason: 'user_not_found' });
      throw new AppError(401, 'Credenciais inválidas');
    }
    if (user.blocked) {
      logger.warn('auth_login_failed', { email, reason: 'user_blocked' });
      throw new AppError(401, 'Credenciais inválidas');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      logger.warn('auth_login_failed', { email, reason: 'invalid_password' });
      throw new AppError(401, 'Credenciais inválidas');
    }
    return this.issueTokens(user.id, user.role, user.email);
  },

  async issueTokens(userId: string, role: Role, email: string) {
    const accessToken = signAccessToken({ sub: userId, role, email });
    const refreshToken = signRefreshToken(userId);
    const expiresAt = new Date(Date.now() + parseJwtExpiryToMs(env.JWT_REFRESH_EXPIRES));
    await refreshTokenRepo.create(userId, refreshToken, expiresAt);
    return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_EXPIRES };
  },

  async refresh(refreshToken: string) {
    let userId: string;
    try {
      userId = verifyRefreshToken(refreshToken).sub;
    } catch {
      throw new AppError(401, 'Refresh token inválido');
    }
    const stored = await refreshTokenRepo.findValid(refreshToken);
    if (!stored || stored.user.blocked) {
      throw new AppError(401, 'Sessão expirada. Faça login novamente.');
    }
    await refreshTokenRepo.deleteById(stored.id);
    return this.issueTokens(stored.user.id, stored.user.role, stored.user.email);
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    const stored = await refreshTokenRepo.findValid(refreshToken);
    if (stored) await refreshTokenRepo.deleteById(stored.id);
  },

  async logoutAll(userId: string) {
    await refreshTokenRepo.deleteByUser(userId);
  },

  async forgotPassword(email: string) {
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return { message: 'Se o e-mail existir, enviaremos instruções.' };
    }
    const raw = randomToken(32);
    const tokenHash = await bcrypt.hash(raw, 10);
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await userRepo.update(user.id, {
      passwordResetToken: tokenHash,
      passwordResetExpires: expires,
    });
    const link = `${env.FRONTEND_URL}/redefinir-senha?token=${raw}&email=${encodeURIComponent(user.email)}`;
    logger.info('password_reset_link', { email: user.email, link });
    return {
      message: 'Se o e-mail existir, enviaremos instruções.',
      devLink: process.env.NODE_ENV !== 'production' ? link : undefined,
    };
  },

  async resetPassword(input: { email: string; token: string; newPassword: string }) {
    const user = await userRepo.findByEmail(input.email);
    if (!user?.passwordResetToken || !user.passwordResetExpires) {
      throw new AppError(400, 'Token inválido ou expirado');
    }
    if (user.passwordResetExpires < new Date()) {
      throw new AppError(400, 'Token expirado');
    }
    const match = await bcrypt.compare(input.token, user.passwordResetToken);
    if (!match) throw new AppError(400, 'Token inválido');
    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await userRepo.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
    await refreshTokenRepo.deleteByUser(user.id);
    return { message: 'Senha atualizada com sucesso.' };
  },
};
