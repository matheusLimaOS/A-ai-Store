import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { routeParam } from '../utils/params';
import { z } from 'zod';

const bodySchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
});

export const categoryController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await categoryService.list();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = bodySchema.parse(req.body);
      const data = await categoryService.create(body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = bodySchema.partial().parse(req.body);
      const data = await categoryService.update(routeParam(req, 'id'), body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await categoryService.delete(routeParam(req, 'id'));
      res.json({ success: true, message: 'Categoria removida' });
    } catch (e) {
      next(e);
    }
  },
};
