import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { paginationSchema, buildMeta } from '../utils/pagination';
import { z } from 'zod';
import { ProductSize, Role } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { routeParam } from '../utils/params';

const listQuery = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional(),
});

const productBody = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  available: z.boolean().optional(),
  freeToppingsLimit: z.number().int().min(0).max(20).optional(),
  mainImageUrl: z.string().url().nullable().optional(),
  sizes: z
    .array(
      z.object({
        size: z.nativeEnum(ProductSize),
        price: z.number().positive(),
      })
    )
    .min(1),
  addons: z.array(
    z.object({
      name: z.string().min(1),
      price: z.number().min(0),
      countsTowardFree: z.boolean(),
      maxPerOrder: z.number().int().positive().nullable().optional(),
    })
  ),
});

export const productController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = listQuery.parse(req.query);
      const { data, total } = await productService.list({
        page: q.page,
        limit: q.limit,
        categorySlug: q.category,
        search: q.search,
        admin: req.originalUrl.includes('/admin/'),
      });
      res.json({ success: true, data, meta: buildMeta(total, q) });
    } catch (e) {
      next(e);
    }
  },
  getBySlug: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as AuthRequest).user?.role === Role.ADMIN;
      const data = await productService.getBySlug(routeParam(req, 'slug'), { admin });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  getById: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await productService.getByIdAdmin(routeParam(_req, 'id'));
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = productBody.parse(req.body);
      const data = await productService.create(body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = productBody.partial().parse(req.body);
      const data = await productService.update(routeParam(req, 'id'), body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  remove: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await productService.delete(routeParam(req, 'id'));
      res.json({ success: true, message: 'Produto removido' });
    } catch (e) {
      next(e);
    }
  },
};
