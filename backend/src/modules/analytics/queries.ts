import { many, one } from '../../lib/query.js';
import { getTeamMemberVisibility } from '../../lib/settings.js';
import type { UserRole } from '../../types/index.js';

export interface AnalyticsSummary {
  kpis: {
    total_projects: number;
    active_projects: number;
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    overdue_tasks: number;
  };
  tasks_by_status: Array<{ status: string; count: number }>;
  tasks_by_priority: Array<{ priority: string; count: number }>;
  projects_by_status: Array<{ status: string; count: number }>;
  tasks_per_project: Array<{
    project_id: string;
    project_name: string;
    total: number;
    completed: number;
    in_progress: number;
    todo: number;
  }>;
  activity_last_7_days: Array<{ day: string; count: number }>;
}

export async function getAnalyticsSummary(
  userId: string,
  userRole: UserRole,
): Promise<AnalyticsSummary> {
  const visibility = userRole === 'TEAM_MEMBER' ? await getTeamMemberVisibility() : 'ALL';
  const scopeTM = userRole === 'TEAM_MEMBER' && visibility === 'ASSIGNED_ONLY';

  // $1 = userId only when TM-scoped; otherwise no params needed for project/task queries
  const params: unknown[] = scopeTM ? [userId] : [];

  // Safe SQL fragments — only userId goes through parameterization ($1)
  const pConds = scopeTM
    ? `p.deleted_at IS NULL AND EXISTS (
         SELECT 1 FROM project_members pm
         WHERE pm.project_id = p.id AND pm.user_id = $1
       )`
    : `p.deleted_at IS NULL`;

  const tConds = scopeTM
    ? `t.deleted_at IS NULL AND (
         t.assignee_id = $1
         OR EXISTS (
           SELECT 1 FROM project_members pm
           WHERE pm.project_id = t.project_id AND pm.user_id = $1
         )
       )`
    : `t.deleted_at IS NULL`;

  const [kpiRow, tasksByStatus, tasksByPriority, projectsByStatus, tasksPerProject, activityDays] =
    await Promise.all([
      // ── KPI scalars ─────────────────────────────────────────────────────────
      one<{
        total_projects: number;
        active_projects: number;
        total_tasks: number;
        completed_tasks: number;
        pending_tasks: number;
        overdue_tasks: number;
      }>(
        `SELECT
          (SELECT count(*)::int FROM projects p WHERE ${pConds})                                                        AS total_projects,
          (SELECT count(*)::int FROM projects p WHERE ${pConds} AND p.status = 'ACTIVE')                               AS active_projects,
          (SELECT count(*)::int FROM tasks    t WHERE ${tConds})                                                        AS total_tasks,
          (SELECT count(*)::int FROM tasks    t WHERE ${tConds} AND t.status = 'COMPLETED')                            AS completed_tasks,
          (SELECT count(*)::int FROM tasks    t WHERE ${tConds} AND t.status <> 'COMPLETED')                           AS pending_tasks,
          (SELECT count(*)::int FROM tasks    t WHERE ${tConds} AND t.due_date < CURRENT_DATE AND t.status <> 'COMPLETED') AS overdue_tasks`,
        params,
      ),

      // ── Tasks by status ──────────────────────────────────────────────────────
      many<{ status: string; count: number }>(
        `SELECT t.status, count(*)::int AS count
         FROM tasks t
         WHERE ${tConds}
         GROUP BY t.status`,
        params,
      ),

      // ── Tasks by priority ────────────────────────────────────────────────────
      many<{ priority: string; count: number }>(
        `SELECT t.priority, count(*)::int AS count
         FROM tasks t
         WHERE ${tConds}
         GROUP BY t.priority`,
        params,
      ),

      // ── Projects by status ───────────────────────────────────────────────────
      many<{ status: string; count: number }>(
        `SELECT p.status, count(*)::int AS count
         FROM projects p
         WHERE ${pConds}
         GROUP BY p.status`,
        params,
      ),

      // ── Tasks per project (top 10 by task volume) ────────────────────────────
      many<{
        project_id: string;
        project_name: string;
        total: number;
        completed: number;
        in_progress: number;
        todo: number;
      }>(
        `SELECT
           p.id   AS project_id,
           p.name AS project_name,
           count(t.id)::int                                             AS total,
           count(t.id) FILTER (WHERE t.status = 'COMPLETED')::int      AS completed,
           count(t.id) FILTER (WHERE t.status = 'IN_PROGRESS')::int    AS in_progress,
           count(t.id) FILTER (WHERE t.status = 'TODO')::int           AS todo
         FROM projects p
         LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
         WHERE ${pConds}
         GROUP BY p.id, p.name
         ORDER BY total DESC, p.name
         LIMIT 10`,
        params,
      ),

      // ── Activity last 7 days ─────────────────────────────────────────────────
      many<{ day: string; count: number }>(
        `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day,
                count(*)::int                           AS count
         FROM activity_logs
         WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY day
         ORDER BY day`,
        [],
      ),
    ]);

  return {
    kpis: kpiRow ?? {
      total_projects: 0,
      active_projects: 0,
      total_tasks: 0,
      completed_tasks: 0,
      pending_tasks: 0,
      overdue_tasks: 0,
    },
    tasks_by_status: tasksByStatus,
    tasks_by_priority: tasksByPriority,
    projects_by_status: projectsByStatus,
    tasks_per_project: tasksPerProject,
    activity_last_7_days: activityDays,
  };
}
