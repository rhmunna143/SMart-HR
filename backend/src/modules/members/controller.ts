import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { listAllUsers } from './queries.js';

export const list = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const users = await listAllUsers({ search });
  sendOk(res, users);
});
