import { many } from '../../lib/query.js';

export interface ActivityRow {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  message: string;
  created_at: string;
}

export async function listRecentActivity(limit: number): Promise<ActivityRow[]> {
  return many<ActivityRow>(
    `SELECT a.id, a.actor_id, u.name AS actor_name, u.email AS actor_email,
            a.action, a.entity_type, a.entity_id, a.message, a.created_at
     FROM activity_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit],
  );
}
