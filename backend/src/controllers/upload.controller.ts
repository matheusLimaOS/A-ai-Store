import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { routeParam } from '../utils/params';

export const uploadController = {
  productImage: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'Arquivo não enviado' });
        return;
      }
      const publicUrl = `${env.PUBLIC_UPLOAD_URL.replace(/\/$/, '')}/${file.filename}`;
      const productId = routeParam(req, 'id');
      await prisma.productImage.create({
        data: { productId, url: publicUrl, sortOrder: 0 },
      });
      await prisma.product.update({
        where: { id: productId },
        data: { mainImageUrl: publicUrl },
      });
      res.status(201).json({ success: true, data: { url: publicUrl } });
    } catch (e) {
      next(e);
    }
  },
};
