'use client';

import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityFeed } from '@/features/activity/ActivityFeed';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          KPI cards and charts arrive in M4. The activity feed below updates as you and your team
          work.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Jump into <span className="font-medium">Projects</span> to create or manage projects,{' '}
              <span className="font-medium">Tasks</span> for the global task board, or{' '}
              <span className="font-medium">Members</span> for workload across your team.
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed limit={10} />
        </div>
      </div>
    </div>
  );
}
