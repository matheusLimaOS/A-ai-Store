import { prisma } from '../lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';

export const orderRepo = {
  create(data: Prisma.OrderCreateInput) {
    return prisma.order.create({ data });
  },
  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } },
    });
  },
  listForUser(userId: string, skip: number, take: number) {
    return prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { items: true },
      }),
      prisma.order.count({ where: { userId } }),
    ]);
  },
  listAdmin(params: { skip: number; take: number; status?: OrderStatus; search?: string }) {
    const where: Prisma.OrderWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { id: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    return prisma.$transaction([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);
  },
  updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  },
};
