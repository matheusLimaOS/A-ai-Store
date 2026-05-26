import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { userRepo } from '../repositories/user.repository';
import { addressRepo } from '../repositories/address.repository';
import { prisma } from '../lib/prisma';

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError(404, 'Usuário não encontrado');
    const { passwordHash: _p, passwordResetToken: _t, passwordResetExpires: _e, ...rest } = user;
    return rest;
  },

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string }
  ) {
    return userRepo.update(userId, data);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'Usuário não encontrado');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new AppError(400, 'Senha atual incorreta');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepo.update(userId, { passwordHash });
  },

  async listAddresses(userId: string) {
    return addressRepo.listByUser(userId);
  },

  async createAddress(
    userId: string,
    input: {
      label?: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zip: string;
      isDefault?: boolean;
    }
  ) {
    if (input.isDefault) await addressRepo.unsetDefault(userId);
    return addressRepo.create({
      user: { connect: { id: userId } },
      ...input,
    });
  },

  async updateAddress(
    userId: string,
    id: string,
    input: Partial<{
      label: string | null;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zip: string;
      isDefault: boolean;
    }>
  ) {
    if (input.isDefault) await addressRepo.unsetDefault(userId);
    const res = await addressRepo.update(id, userId, input);
    if (res.count === 0) throw new AppError(404, 'Endereço não encontrado');
    return prisma.address.findFirst({ where: { id, userId } });
  },

  async deleteAddress(userId: string, id: string) {
    const res = await addressRepo.delete(id, userId);
    if (res.count === 0) throw new AppError(404, 'Endereço não encontrado');
  },

  async adminList(params: { skip: number; take: number; search?: string }) {
    return userRepo.list(params);
  },

  async adminUpdate(id: string, data: { blocked?: boolean; role?: Role }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(404, 'Usuário não encontrado');
    await userRepo.update(id, data);
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, phone: true, role: true, blocked: true, createdAt: true },
    });
  },
};
