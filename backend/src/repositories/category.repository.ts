import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const categoryRepo = {
  list() {
    return prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  },
  findBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  },
  findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },
  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },
  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};
