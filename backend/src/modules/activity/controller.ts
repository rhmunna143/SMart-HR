import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { listRecentActivity } from './queries.js';

export const list = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
  const rows = await listRecentActivity(limit);
  sendOk(res, rows);
});
