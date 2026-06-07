import { api } from '@/lib/api';

export interface KpiData {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
}

export interface ProjectProgress {
  project_id: string;
  project_name: string;
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
}

export interface ActivityDay {
  day: string;
  count: number;
}

export interface AnalyticsSummary {
  kpis: KpiData;
  tasks_by_status: Array<{ status: string; count: number }>;
  tasks_by_priority: Array<{ priority: string; count: number }>;
  projects_by_status: Array<{ status: string; count: number }>;
  tasks_per_project: ProjectProgress[];
  activity_last_7_days: ActivityDay[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return api.get<AnalyticsSummary>('/analytics/summary');
}
