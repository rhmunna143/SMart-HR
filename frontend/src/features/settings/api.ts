import { api } from '@/lib/api';

export type VisibilitySetting = 'ASSIGNED_ONLY' | 'ALL';

export interface AppSettings {
  team_member_project_visibility: VisibilitySetting;
}

export async function getSettings(): Promise<AppSettings> {
  return api.get<AppSettings>('/settings');
}

export async function updateVisibility(value: VisibilitySetting): Promise<AppSettings> {
  return api.patch<AppSettings>('/settings', {
    team_member_project_visibility: value,
  });
}
