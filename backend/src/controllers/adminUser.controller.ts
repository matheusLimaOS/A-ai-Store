import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { userService } from '../services/user.service';
import { paginationSchema, buildMeta, skipTake } from '../utils/pagination';
import { routeParam } from '../utils/params';
import { z } from 'zod';
import { Role } from '@prisma/client';

const adminUserUpdate = z.object({
  blocked: z.boolean().optional(),
  role: z.nativeEnum(Role).optional(),
});

export const adminUserController = {
  list: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = paginationSchema.merge(z.object({ search: z.string().optional() })).parse(req.query);
      const { skip, take } = skipTake(q);
      const [rows, total] = await userService.adminList({
        skip,
        take,
        search: q.search,
      });
      res.json({ success: true, data: rows, meta: buildMeta(total, q) });
    } catch (e) {
      next(e);
    }
  },
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = adminUserUpdate.parse(req.body);
      const user = await userService.adminUpdate(routeParam(req, 'id'), body);
      res.json({ success: true, data: user });
    } catch (e) {
      next(e);
    }
  },
};
