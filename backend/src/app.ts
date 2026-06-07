import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env.js';
import { sendOk } from './lib/response.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authRouter } from './modules/auth/router.js';
import { projectsRouter } from './modules/projects/router.js';
import { tasksRouter } from './modules/tasks/router.js';
import { membersRouter, projectMembersRouter } from './modules/members/router.js';
import { activityRouter } from './modules/activity/router.js';
import { analyticsRouter } from './modules/analytics/router.js';
import { taskCommentsRouter, commentsRouter } from './modules/comments/router.js';
import { taskAttachmentsRouter, attachmentsRouter } from './modules/attachments/router.js';
import { notificationsRouter } from './modules/notifications/router.js';
import { settingsRouter } from './modules/settings/router.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  // Increase body limit for JSON; file uploads use multipart (multer)
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/v1/health', (_req, res) => {
    sendOk(res, { ok: true, time: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/tasks/:taskId/comments', taskCommentsRouter);
  app.use('/api/v1/tasks/:taskId/attachments', taskAttachmentsRouter);
  app.use('/api/v1/members', membersRouter);
  app.use('/api/v1/projects/:id/members', projectMembersRouter);
  app.use('/api/v1/activity', activityRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/comments', commentsRouter);
  app.use('/api/v1/attachments', attachmentsRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/settings', settingsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
