import { many, one, query } from '../../lib/query.js';

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export async function listNotifications(userId: string, limit = 50): Promise<Notification[]> {
  return many<Notification>(
    `SELECT id, user_id, message, read, created_at
     FROM   notifications
     WHERE  user_id = $1
     ORDER  BY created_at DESC
     LIMIT  $2`,
    [userId, limit],
  );
}

export async function countUnread(userId: string): Promise<number> {
  const row = await one<{ n: number }>(
    `SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND read = false`,
    [userId],
  );
  return row?.n ?? 0;
}

export async function markOneRead(id: string, userId: string): Promise<boolean> {
  const r = await query(
    `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function markAllRead(userId: string): Promise<void> {
  await query(`UPDATE notifications SET read = true WHERE user_id = $1`, [userId]);
}

export async function insertNotification(
  userId: string,
  message: string,
): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
    [userId, message],
  );
}
