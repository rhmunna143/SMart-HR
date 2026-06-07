import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendOk } from '../../lib/response.js';
import { validate } from '../../lib/validate.js';
import { getVisibilitySetting, setVisibilitySetting } from './queries.js';

// GET /settings
export const get = asyncHandler(async (_req: Request, res: Response) => {
  const visibility = await getVisibilitySetting();
  sendOk(res, { team_member_project_visibility: visibility });
});

// PATCH /settings  (Admin only — enforced by router)
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { team_member_project_visibility } = validate(req.body, (v) => ({
    team_member_project_visibility: v.enumOf(
      'team_member_project_visibility',
      ['ASSIGNED_ONLY', 'ALL'] as const,
    ),
  }));
  await setVisibilitySetting(team_member_project_visibility, req.user!.id);
  sendOk(res, { team_member_project_visibility });
});
