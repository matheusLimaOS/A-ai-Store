import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { couponService } from '../services/coupon.service';
import { paginationSchema, buildMeta } from '../utils/pagination';
import { routeParam } from '../utils/params';
import { z } from 'zod';
import { CouponType } from '@prisma/client';

const couponBody = z.object({
  code: z.string().min(3),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  validFrom: z.string(),
  validTo: z.string(),
  maxUses: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
});

export const couponController = {
  list: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = paginationSchema.parse(_req.query);
      const { data, total } = await couponService.list(q.page, q.limit);
      res.json({ success: true, data, meta: buildMeta(total, q) });
    } catch (e) {
      next(e);
    }
  },
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = couponBody.parse(req.body);
      const data = await couponService.create(body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = couponBody.partial().parse(req.body);
      const data = await couponService.update(routeParam(req, 'id'), body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  remove: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await couponService.delete(routeParam(req, 'id'));
      res.json({ success: true, message: 'Cupom removido' });
    } catch (e) {
      next(e);
    }
  },
};
