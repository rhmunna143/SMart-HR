import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env.js';
import { sendOk } from './lib/response.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authRouter } from './modules/auth/router.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/v1/health', (_req, res) => {
    sendOk(res, { ok: true, time: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
