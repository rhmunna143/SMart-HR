import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as c from './controller.js';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get('/', c.list);
projectsRouter.get('/:id', c.get);
projectsRouter.post('/', requireRole('ADMIN', 'PROJECT_MANAGER'), c.create);
projectsRouter.patch('/:id', requireRole('ADMIN', 'PROJECT_MANAGER'), c.update);
projectsRouter.delete('/:id', requireRole('ADMIN', 'PROJECT_MANAGER'), c.remove);
projectsRouter.post('/:id/restore', requireRole('ADMIN', 'PROJECT_MANAGER'), c.restore);
