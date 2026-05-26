import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { productRepo } from '../repositories/product.repository';
import { prisma } from '../lib/prisma';
import { ProductSize } from '@prisma/client';

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export const productService = {
  async list(params: {
    page: number;
    limit: number;
    categorySlug?: string;
    search?: string;
    admin?: boolean;
  }) {
    const skip = (params.page - 1) * params.limit;
    const [rows, total] = await productRepo.list({
      skip,
      take: params.limit,
      categorySlug: params.categorySlug,
      search: params.search,
      availableOnly: !params.admin,
    });
    return { data: rows.map(serializeProduct), total };
  },

  async getBySlug(slug: string, opts?: { admin?: boolean }) {
    const p = await productRepo.findBySlug(slug);
    if (!p) throw new AppError(404, 'Produto não encontrado');
    if (!opts?.admin && !p.available) throw new AppError(404, 'Produto indisponível');
    return serializeProductDetail(p);
  },

  async getByIdAdmin(id: string) {
    const p = await productRepo.findById(id);
    if (!p) throw new AppError(404, 'Produto não encontrado');
    return serializeProductDetail(p);
  },

  async create(input: {
    name: string;
    slug?: string;
    description: string;
    categoryId: string;
    available?: boolean;
    freeToppingsLimit?: number;
    mainImageUrl?: string | null;
    sizes: { size: ProductSize; price: number }[];
    addons: {
      name: string;
      price: number;
      countsTowardFree: boolean;
      maxPerOrder?: number | null;
    }[];
  }) {
    const slug = input.slug?.trim() || slugify(input.name);
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) throw new AppError(409, 'Slug já utilizado');
    const product = await productRepo.create({
      name: input.name,
      slug,
      description: input.description,
      category: { connect: { id: input.categoryId } },
      available: input.available ?? true,
      freeToppingsLimit: input.freeToppingsLimit ?? 3,
      mainImageUrl: input.mainImageUrl ?? null,
    });
    await productRepo.replaceSizes(product.id, input.sizes);
    await productRepo.replaceAddons(product.id, input.addons);
    return this.getByIdAdmin(product.id);
  },

  async update(
    id: string,
    input: Partial<{
      name: string;
      slug: string;
      description: string;
      categoryId: string;
      available: boolean;
      freeToppingsLimit: number;
      mainImageUrl: string | null;
      sizes: { size: ProductSize; price: number }[];
      addons: {
        name: string;
        price: number;
        countsTowardFree: boolean;
        maxPerOrder?: number | null;
      }[];
    }>
  ) {
    const existing = await productRepo.findById(id);
    if (!existing) throw new AppError(404, 'Produto não encontrado');
    const data: Prisma.ProductUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
    if (input.available !== undefined) data.available = input.available;
    if (input.freeToppingsLimit !== undefined) data.freeToppingsLimit = input.freeToppingsLimit;
    if (input.mainImageUrl !== undefined) data.mainImageUrl = input.mainImageUrl;
    if (Object.keys(data).length) await productRepo.update(id, data);
    if (input.sizes) await productRepo.replaceSizes(id, input.sizes);
    if (input.addons) await productRepo.replaceAddons(id, input.addons);
    return this.getByIdAdmin(id);
  },

  async delete(id: string) {
    await productRepo.delete(id);
  },

  async setMainImage(id: string, url: string) {
    await productRepo.update(id, { mainImageUrl: url });
    return this.getByIdAdmin(id);
  },
};

function serializeProduct(p: {
  id: string;
  name: string;
  slug: string;
  description: string;
  available: boolean;
  mainImageUrl: string | null;
  freeToppingsLimit: number;
  category: { name: string; slug: string };
  sizes: { size: ProductSize; price: Prisma.Decimal }[];
  addons: { id: string; name: string; price: Prisma.Decimal; countsTowardFree: boolean }[];
}) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    available: p.available,
    mainImageUrl: p.mainImageUrl,
    freeToppingsLimit: p.freeToppingsLimit,
    category: p.category,
    sizes: p.sizes.map((s) => ({ size: s.size, price: Number(s.price) })),
    addons: p.addons.map((a) => ({
      id: a.id,
      name: a.name,
      price: Number(a.price),
      countsTowardFree: a.countsTowardFree,
    })),
    minPrice: Math.min(...p.sizes.map((s) => Number(s.price))),
  };
}

function serializeProductDetail(p: NonNullable<Awaited<ReturnType<typeof productRepo.findById>>>) {
  return {
    ...serializeProduct({
      ...p,
      category: p.category,
    }),
    images: p.images.map((i) => ({ id: i.id, url: i.url, sortOrder: i.sortOrder })),
    addons: p.addons.map((a) => ({
      id: a.id,
      name: a.name,
      price: Number(a.price),
      countsTowardFree: a.countsTowardFree,
      maxPerOrder: a.maxPerOrder,
    })),
  };
}
