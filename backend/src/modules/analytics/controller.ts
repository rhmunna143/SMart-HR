import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { getAnalyticsSummary } from './queries.js';

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const data = await getAnalyticsSummary(req.user!.id, req.user!.role);
  sendOk(res, data);
});
