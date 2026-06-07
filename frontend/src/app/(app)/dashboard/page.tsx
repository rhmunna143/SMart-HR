'use client';

import { AlertTriangle, CheckCircle2, Clock, FolderOpen, LayoutGrid, ListTodo } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { KpiCard } from '@/components/KpiCard';
import { ActivityFeed } from '@/features/activity/ActivityFeed';
import { DashboardCharts } from '@/features/dashboard/Charts';
import { useAnalyticsSummary } from '@/features/analytics/hooks';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useAnalyticsSummary();

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s how your team is doing today.
        </p>
      </div>

      {/* ── KPI grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          title="Total Projects"
          value={data?.kpis.total_projects ?? 0}
          icon={<LayoutGrid className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          title="Active Projects"
          value={data?.kpis.active_projects ?? 0}
          icon={<FolderOpen className="h-4 w-4" />}
          variant="success"
          loading={isLoading}
        />
        <KpiCard
          title="Total Tasks"
          value={data?.kpis.total_tasks ?? 0}
          icon={<ListTodo className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          title="Completed"
          value={data?.kpis.completed_tasks ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
          loading={isLoading}
        />
        <KpiCard
          title="Pending"
          value={data?.kpis.pending_tasks ?? 0}
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
          loading={isLoading}
        />
        <KpiCard
          title="Overdue"
          value={data?.kpis.overdue_tasks ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="danger"
          loading={isLoading}
        />
      </div>

      {/* ── Charts + Activity feed ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Charts take 2/3 */}
        <div className="lg:col-span-2">
          {data && <DashboardCharts summary={data} />}
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed takes 1/3 */}
        <div>
          <ActivityFeed limit={15} />
        </div>
      </div>
    </div>
  );
}
