import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

const app = createApp();

async function bootstrap() {
  try {
    await prisma.$connect();
    let dbLabel = 'configured';
    try {
      dbLabel = new URL(env.DATABASE_URL).pathname || 'configured';
    } catch {
      /* ignore parse errors for log */
    }
    logger.info('database_connected', { database: dbLabel });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('database_connection_failed', { message });
    logger.error('database_connection_hint', {
      hint: 'Confira DATABASE_URL em backend/.env (host localhost, porta 5433 no host, usuário, senha e nome do DB).',
    });
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    logger.info('server_started', { port: env.PORT, env: env.NODE_ENV });
  });
}

bootstrap();
