import { many, one, query } from '../../lib/query.js';

export interface AttachmentMeta {
  id: string;
  task_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_id: string;
  uploader_name: string;
  created_at: string;
}

export interface AttachmentRow extends AttachmentMeta {
  data: Buffer;
}

export async function listAttachments(taskId: string): Promise<AttachmentMeta[]> {
  return many<AttachmentMeta>(
    `SELECT a.id, a.task_id, a.filename, a.mime_type, a.size_bytes,
            a.uploaded_by_id, u.name AS uploader_name, a.created_at
     FROM   attachments a
     JOIN   users u ON u.id = a.uploaded_by_id
     WHERE  a.task_id = $1
     ORDER  BY a.created_at ASC`,
    [taskId],
  );
}

export async function insertAttachment(opts: {
  taskId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
  uploadedById: string;
}): Promise<AttachmentMeta> {
  const row = await one<AttachmentMeta>(
    `WITH ins AS (
       INSERT INTO attachments (task_id, filename, mime_type, size_bytes, data, uploaded_by_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *
     )
     SELECT ins.id, ins.task_id, ins.filename, ins.mime_type, ins.size_bytes,
            ins.uploaded_by_id, u.name AS uploader_name, ins.created_at
     FROM   ins
     JOIN   users u ON u.id = ins.uploaded_by_id`,
    [opts.taskId, opts.filename, opts.mimeType, opts.sizeBytes, opts.data, opts.uploadedById],
  );
  return row!;
}

export async function findAttachmentById(id: string): Promise<AttachmentRow | null> {
  return one<AttachmentRow>(
    `SELECT a.id, a.task_id, a.filename, a.mime_type, a.size_bytes,
            a.uploaded_by_id, u.name AS uploader_name,
            a.data, a.created_at
     FROM   attachments a
     JOIN   users u ON u.id = a.uploaded_by_id
     WHERE  a.id = $1`,
    [id],
  );
}

export async function deleteAttachment(id: string): Promise<boolean> {
  const r = await query(`DELETE FROM attachments WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}
