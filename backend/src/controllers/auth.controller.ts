import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
    z.string().email()
  ),
  password: z.preprocess((val) => (typeof val === 'string' ? val.trim() : val), z.string().min(1)),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  newPassword: z.string().min(6),
});

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = registerSchema.parse(req.body);
      const tokens = await authService.register(body);
      res.status(201).json({ success: true, data: tokens });
    } catch (e) {
      next(e);
    }
  },
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = loginSchema.parse(req.body);
      const tokens = await authService.login(body);
      res.json({ success: true, data: tokens });
    } catch (e) {
      next(e);
    }
  },
  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = refreshSchema.parse(req.body);
      const tokens = await authService.refresh(body.refreshToken);
      res.json({ success: true, data: tokens });
    } catch (e) {
      next(e);
    }
  },
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = refreshSchema.partial().parse(req.body);
      await authService.logout(body.refreshToken);
      res.json({ success: true, message: 'Logout realizado' });
    } catch (e) {
      next(e);
    }
  },
  forgot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = forgotSchema.parse(req.body);
      const out = await authService.forgotPassword(body.email);
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },
  reset: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = resetSchema.parse(req.body);
      const out = await authService.resetPassword(body);
      res.json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },
};
