'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsSummary } from '@/features/analytics/api';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#22c55e',
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

function fmt(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function short(s: string, max = 14) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface Props {
  summary: AnalyticsSummary;
}

export function DashboardCharts({ summary }: Props) {
  const statusData = summary.tasks_by_status.map((d) => ({
    name: fmt(d.status),
    count: d.count,
    fill: STATUS_COLORS[d.status] ?? '#6b7280',
  }));

  const priorityData = summary.tasks_by_priority.map((d) => ({
    name: fmt(d.priority),
    count: d.count,
    fill: PRIORITY_COLORS[d.priority] ?? '#6b7280',
  }));

  const projectData = summary.tasks_per_project.slice(0, 8).map((p) => ({
    name: short(p.project_name),
    todo: p.todo,
    in_progress: p.in_progress,
    completed: p.completed,
  }));

  const activityData = summary.activity_last_7_days.map((d) => ({
    day: d.day.slice(5), // MM-DD
    count: d.count,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* ── Tasks by Status donut ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tasks by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                >
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'tasks']} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Tasks by Priority bar ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Tasks by Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priorityData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                <Tooltip formatter={(v) => [v, 'tasks']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Tasks per Project stacked bar ────────────────────────────────── */}
      {projectData.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tasks per Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                <Tooltip />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-foreground">{fmt(value)}</span>
                  )}
                />
                <Bar
                  dataKey="todo"
                  name="Todo"
                  stackId="s"
                  fill={STATUS_COLORS.TODO}
                />
                <Bar
                  dataKey="in_progress"
                  name="In Progress"
                  stackId="s"
                  fill={STATUS_COLORS.IN_PROGRESS}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  stackId="s"
                  fill={STATUS_COLORS.COMPLETED}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Activity last 7 days area chart ──────────────────────────────── */}
      <Card className={projectData.length > 0 ? 'md:col-span-2' : ''}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Activity — Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                <Tooltip formatter={(v) => [v, 'actions']} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#actGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
