import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as c from './controller.js';

export const authRouter = Router();

authRouter.post('/signup', c.signup);
authRouter.post('/login', c.login);
authRouter.post('/demo-login', c.demoLogin);
authRouter.post('/refresh', c.refresh);
authRouter.post('/logout', c.logout);
authRouter.get('/me', requireAuth, c.me);
