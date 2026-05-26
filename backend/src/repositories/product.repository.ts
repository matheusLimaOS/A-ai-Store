import { prisma } from '../lib/prisma';
import { Prisma, ProductSize } from '@prisma/client';

export const productRepo = {
  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true, sizes: true, addons: true, images: true },
    });
  },
  findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: { category: true, sizes: true, addons: true, images: true },
    });
  },
  list(params: {
    skip: number;
    take: number;
    categorySlug?: string;
    search?: string;
    availableOnly?: boolean;
  }) {
    const where: Prisma.ProductWhereInput = {};
    if (params.categorySlug) {
      where.category = { slug: params.categorySlug };
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.availableOnly) {
      where.available = true;
    }
    return prisma.$transaction([
      prisma.product.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: { category: true, sizes: true, addons: true },
      }),
      prisma.product.count({ where }),
    ]);
  },
  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },
  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },
  replaceSizes(productId: string, rows: { size: ProductSize; price: number }[]) {
    return prisma.$transaction([
      prisma.productSizePrice.deleteMany({ where: { productId } }),
      prisma.productSizePrice.createMany({
        data: rows.map((r) => ({
          productId,
          size: r.size,
          price: r.price,
        })),
      }),
    ]);
  },
  replaceAddons(
    productId: string,
    rows: {
      name: string;
      price: number;
      countsTowardFree: boolean;
      maxPerOrder?: number | null;
    }[]
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.productAddon.deleteMany({ where: { productId } });
      if (rows.length) {
        await tx.productAddon.createMany({
          data: rows.map((r) => ({
            productId,
            name: r.name,
            price: r.price,
            countsTowardFree: r.countsTowardFree,
            maxPerOrder: r.maxPerOrder ?? null,
          })),
        });
      }
    });
  },
};
