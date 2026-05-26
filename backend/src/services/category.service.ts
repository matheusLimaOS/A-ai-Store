import { AppError } from '../utils/AppError';
import { categoryRepo } from '../repositories/category.repository';
import { prisma } from '../lib/prisma';

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export const categoryService = {
  async list() {
    return categoryRepo.list();
  },
  async create(input: { name: string; slug?: string; description?: string; imageUrl?: string; sortOrder?: number }) {
    const slug = input.slug?.trim() || slugify(input.name);
    const exists = await categoryRepo.findBySlug(slug);
    if (exists) throw new AppError(409, 'Slug de categoria já existe');
    return categoryRepo.create({
      name: input.name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      sortOrder: input.sortOrder ?? 0,
    });
  },
  async update(
    id: string,
    input: Partial<{ name: string; slug: string; description: string | null; imageUrl: string | null; sortOrder: number }>
  ) {
    const c = await categoryRepo.findById(id);
    if (!c) throw new AppError(404, 'Categoria não encontrada');
    return categoryRepo.update(id, input);
  },
  async delete(id: string) {
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) throw new AppError(400, 'Existem produtos nesta categoria');
    await categoryRepo.delete(id);
  },
};
