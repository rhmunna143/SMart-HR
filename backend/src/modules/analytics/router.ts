import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { summary } from './controller.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get('/summary', summary);
