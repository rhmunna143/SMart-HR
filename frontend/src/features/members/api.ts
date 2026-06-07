import { api } from '@/lib/api';
import type { User } from '@/types';

export async function listMembers(search?: string): Promise<User[]> {
  return api.get<User[]>('/members', { query: { search } });
}
