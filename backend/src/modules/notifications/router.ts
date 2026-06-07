import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { list, unreadCount, markRead, markAllRead } from './controller.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get('/', list);
notificationsRouter.get('/unread-count', unreadCount);
// read-all must come before /:id/read so it isn't consumed as :id = "read-all"
notificationsRouter.patch('/read-all', markAllRead);
notificationsRouter.patch('/:id/read', markRead);
