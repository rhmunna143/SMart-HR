import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { get, update } from './controller.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);
settingsRouter.get('/', get);
settingsRouter.patch('/', requireRole('ADMIN'), update);
