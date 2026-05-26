import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { userService } from '../services/user.service';
import { routeParam } from '../utils/params';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip: z.string().min(8),
  isDefault: z.boolean().optional(),
});

export const userController = {
  me: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await userService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (e) {
      next(e);
    }
  },
  updateMe: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = profileSchema.parse(req.body);
      await userService.updateProfile(req.user!.id, body);
      const profile = await userService.getProfile(req.user!.id);
      res.json({ success: true, data: profile });
    } catch (e) {
      next(e);
    }
  },
  changePassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = passwordSchema.parse(req.body);
      await userService.changePassword(req.user!.id, body.currentPassword, body.newPassword);
      res.json({ success: true, message: 'Senha alterada' });
    } catch (e) {
      next(e);
    }
  },
  listAddresses: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await userService.listAddresses(req.user!.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  createAddress: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = addressSchema.parse(req.body);
      const data = await userService.createAddress(req.user!.id, body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  updateAddress: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = addressSchema.partial().parse(req.body);
      const data = await userService.updateAddress(req.user!.id, routeParam(req, 'id'), body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
  deleteAddress: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await userService.deleteAddress(req.user!.id, routeParam(req, 'id'));
      res.json({ success: true, message: 'Endereço removido' });
    } catch (e) {
      next(e);
    }
  },
};
