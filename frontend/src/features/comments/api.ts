import { api } from '@/lib/api';
import type { Comment } from '@/types';

export async function listComments(taskId: string): Promise<Comment[]> {
  return api.get<Comment[]>(`/tasks/${taskId}/comments`);
}

export async function createComment(taskId: string, body: string): Promise<Comment> {
  return api.post<Comment>(`/tasks/${taskId}/comments`, { body });
}

export async function deleteComment(id: string): Promise<void> {
  await api.del(`/comments/${id}`);
}
