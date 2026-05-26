import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import multer from 'multer';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { swaggerSpec } from './swagger';

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      // Em dev, reflete o Origin (Vite :5173, Docker UI :8080, etc.). Em produção, só FRONTEND_URL.
      origin:
        env.NODE_ENV === 'development'
          ? true
          : [env.FRONTEND_URL].filter(Boolean),
      credentials: true,
    })
  );
  app.use(morgan('combined'));
  app.use(express.json({ limit: '2mb' }));

  const uploadDir = path.resolve(env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use('/api', apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Rota não encontrada' });
  });

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    errorHandler(err, req, res, next);
  });

  return app;
}
