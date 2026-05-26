import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { orderService } from '../services/order.service';
import { paginationSchema, buildMeta } from '../utils/pagination';
import { routeParam } from '../utils/params';
import { z } from 'zod';
import { OrderStatus, PaymentMethod, ProductSize } from '@prisma/client';

const orderCreate = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  delivery: z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zip: z.string(),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      size: z.nativeEnum(ProductSize),
      addons: z.array(z.object({ addonId: z.string(), qty: z.number().int().positive() })),
      notes: z.string().optional(),
    })
  ),
});

const adminListQuery = paginationSchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().optional(),
});

export const orderController = {
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = orderCreate.parse(req.body);
      const data = await orderService.create(req.user!.id, body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  mine: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = paginationSchema.parse(req.query);
      const { data, total } = await orderService.listMine(req.user!.id, q.page, q.limit);
      res.json({ success: true, data, meta: buildMeta(total, q) });
    } catch (e) {
      next(e);
    }
  },
  getOne: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await orderService.getById(routeParam(req, 'id'), req.user!.id, false);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  adminList: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = adminListQuery.parse(req.query);
      const { data, total } = await orderService.adminList({
        page: q.page,
        limit: q.limit,
        status: q.status,
        search: q.search,
      });
      res.json({ success: true, data, meta: buildMeta(total, q) });
    } catch (e) {
      next(e);
    }
  },
  adminGet: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await orderService.getById(routeParam(req, 'id'), undefined, true);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  adminStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = z.object({ status: z.nativeEnum(OrderStatus) }).parse(req.body);
      const data = await orderService.updateStatus(routeParam(req, 'id'), body.status);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};
