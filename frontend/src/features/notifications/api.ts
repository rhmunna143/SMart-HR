import { api, requestRaw } from '@/lib/api';
import type { Notification } from '@/types';

export interface NotificationsResponse {
  rows: Notification[];
  unread: number;
}

export async function listNotifications(limit = 50): Promise<NotificationsResponse> {
  const env = await requestRaw<Notification[]>('/notifications', {
    method: 'GET',
    query: { limit },
  });
  const unread = (env.meta as { unread?: number } | undefined)?.unread ?? 0;
  return { rows: env.data, unread };
}

export async function getUnreadCount(): Promise<number> {
  const data = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
