import { OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const statsService = {
  async dashboard() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [salesAgg, ordersToday, topProducts] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const salesSeries: { date: string; total: number }[] = [];
    for (const d of last7) {
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      const agg = await prisma.order.aggregate({
        where: {
          status: { not: OrderStatus.CANCELLED },
          createdAt: { gte: d, lte: end },
        },
        _sum: { total: true },
      });
      salesSeries.push({
        date: d.toISOString().slice(0, 10),
        total: Number(agg._sum.total ?? 0),
      });
    }

    return {
      totalSales: Number(salesAgg._sum.total ?? 0),
      ordersToday,
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        quantity: p._sum.quantity ?? 0,
      })),
      salesLast7Days: salesSeries,
    };
  },
};
