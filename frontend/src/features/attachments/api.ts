import { api, getAccessToken } from '@/lib/api';
import type { AttachmentMeta } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function listAttachments(taskId: string): Promise<AttachmentMeta[]> {
  return api.get<AttachmentMeta[]>(`/tasks/${taskId}/attachments`);
}

export async function uploadAttachment(
  taskId: string,
  file: File,
): Promise<AttachmentMeta> {
  const fd = new FormData();
  fd.append('file', file);
  return api.upload<AttachmentMeta>(`/tasks/${taskId}/attachments`, fd);
}

/** Opens the download in a new tab using a direct fetch with the current Bearer token */
export async function downloadAttachment(id: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}/attachments/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteAttachment(id: string): Promise<void> {
  await api.del(`/attachments/${id}`);
}
