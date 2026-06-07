import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProjectStatus, TaskPriority, TaskStatus } from '@/types';

const TASK_STATUS_STYLE: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200',
};

const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200',
  ON_HOLD: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200',
};

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  HIGH: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200',
  LOW: 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200',
};

function label(s: string) {
  return s.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={cn('font-medium', TASK_STATUS_STYLE[status])}>{label(status)}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge className={cn('font-medium', PROJECT_STATUS_STYLE[status])}>{label(status)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge className={cn('font-medium', PRIORITY_STYLE[priority])}>{label(priority)}</Badge>;
}
