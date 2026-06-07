import { one } from './query.js';

export type VisibilitySetting = 'ASSIGNED_ONLY' | 'ALL';

/**
 * Reads team_member_project_visibility from app_settings. Returns the default
 * if the row is missing for any reason.
 */
export async function getTeamMemberVisibility(): Promise<VisibilitySetting> {
  const row = await one<{ value: string }>(
    `SELECT value::text AS value FROM app_settings WHERE key = $1`,
    ['team_member_project_visibility'],
  );
  if (!row) return 'ASSIGNED_ONLY';
  // value is a JSONB string, so it comes back wrapped in quotes when cast to text
  const v = row.value.replace(/^"|"$/g, '');
  return v === 'ALL' ? 'ALL' : 'ASSIGNED_ONLY';
}
