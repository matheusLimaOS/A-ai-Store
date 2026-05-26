import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { statsService } from '../services/stats.service';

export const statsController = {
  dashboard: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await statsService.dashboard();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};
