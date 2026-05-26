import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const couponRepo = {
  findByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  },
  findById(id: string) {
    return prisma.coupon.findUnique({ where: { id } });
  },
  list(skip: number, take: number) {
    return prisma.$transaction([
      prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.coupon.count(),
    ]);
  },
  create(data: Prisma.CouponCreateInput) {
    return prisma.coupon.create({ data });
  },
  update(id: string, data: Prisma.CouponUpdateInput) {
    return prisma.coupon.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.coupon.delete({ where: { id } });
  },
  incrementUsage(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
  },
};
