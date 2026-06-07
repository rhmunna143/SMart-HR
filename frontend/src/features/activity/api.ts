import { api } from '@/lib/api';

export interface ActivityEntry {
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

export async function listActivity(limit = 20): Promise<ActivityEntry[]> {
  return api.get<ActivityEntry[]>('/activity', { query: { limit } });
}
