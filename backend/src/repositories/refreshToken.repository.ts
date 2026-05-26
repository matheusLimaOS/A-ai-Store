import { prisma } from '../lib/prisma';
import { hashToken } from '../utils/crypto';

export const refreshTokenRepo = {
  async create(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });
  },
  async findValid(token: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
  },
  async deleteById(id: string) {
    return prisma.refreshToken.delete({ where: { id } });
  },
  async deleteByUser(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  },
};
