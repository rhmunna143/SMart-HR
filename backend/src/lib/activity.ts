import { query } from './query.js';

export type EntityType = 'PROJECT' | 'TASK' | 'MEMBER' | 'COMMENT' | 'ATTACHMENT' | 'SETTING';

export async function logActivity(opts: {
  actorId: string | null;
  action: string;
  entityType: EntityType;
  entityId: string | null;
  message: string;
}): Promise<void> {
  await query(
    `INSERT INTO activity_logs (actor_id, action, entity_type, entity_id, message)
     VALUES ($1,$2,$3,$4,$5)`,
    [opts.actorId, opts.action, opts.entityType, opts.entityId, opts.message],
  );
}
