import { one, query } from '../../lib/query.js';

export type VisibilitySetting = 'ASSIGNED_ONLY' | 'ALL';

export async function getVisibilitySetting(): Promise<VisibilitySetting> {
  const row = await one<{ value: string }>(
    `SELECT value::text AS value FROM app_settings WHERE key = $1`,
    ['team_member_project_visibility'],
  );
  if (!row) return 'ASSIGNED_ONLY';
  const v = row.value.replace(/^"|"$/g, '');
  return v === 'ALL' ? 'ALL' : 'ASSIGNED_ONLY';
}

export async function setVisibilitySetting(
  value: VisibilitySetting,
  updatedById: string,
): Promise<void> {
  await query(
    `INSERT INTO app_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, now())
     ON CONFLICT (key) DO UPDATE
       SET value      = EXCLUDED.value,
           updated_by = EXCLUDED.updated_by,
           updated_at = EXCLUDED.updated_at`,
    ['team_member_project_visibility', JSON.stringify(value), updatedById],
  );
}
