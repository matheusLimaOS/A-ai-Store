import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const addressRepo = {
  listByUser(userId: string) {
    return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  },
  create(data: Prisma.AddressCreateInput) {
    return prisma.address.create({ data });
  },
  update(id: string, userId: string, data: Prisma.AddressUpdateInput) {
    return prisma.address.updateMany({ where: { id, userId }, data });
  },
  delete(id: string, userId: string) {
    return prisma.address.deleteMany({ where: { id, userId } });
  },
  unsetDefault(userId: string) {
    return prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  },
};
