import { many, one, query } from '../../lib/query.js';

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  body: string;
  created_at: string;
}

export async function listComments(taskId: string): Promise<Comment[]> {
  return many<Comment>(
    `SELECT c.id, c.task_id, c.author_id,
            u.name  AS author_name,
            u.email AS author_email,
            c.body, c.created_at
     FROM   comments c
     JOIN   users u ON u.id = c.author_id
     WHERE  c.task_id = $1
     ORDER  BY c.created_at ASC`,
    [taskId],
  );
}

export async function insertComment(
  taskId: string,
  authorId: string,
  body: string,
): Promise<Comment> {
  const row = await one<Comment>(
    `WITH ins AS (
       INSERT INTO comments (task_id, author_id, body)
       VALUES ($1, $2, $3) RETURNING *
     )
     SELECT ins.id, ins.task_id, ins.author_id,
            u.name  AS author_name,
            u.email AS author_email,
            ins.body, ins.created_at
     FROM   ins
     JOIN   users u ON u.id = ins.author_id`,
    [taskId, authorId, body],
  );
  return row!;
}

export async function findCommentById(id: string): Promise<Comment | null> {
  return one<Comment>(
    `SELECT c.id, c.task_id, c.author_id,
            u.name  AS author_name,
            u.email AS author_email,
            c.body, c.created_at
     FROM   comments c
     JOIN   users u ON u.id = c.author_id
     WHERE  c.id = $1`,
    [id],
  );
}

export async function deleteComment(id: string): Promise<boolean> {
  const r = await query(`DELETE FROM comments WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}
