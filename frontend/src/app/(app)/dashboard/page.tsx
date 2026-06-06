'use client';

import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          KPIs, recent activity, and charts will appear here once M4 ships.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Foundation ready</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Auth, RBAC, and the DB schema are wired up. Projects and tasks ship in M2.
        </CardContent>
      </Card>
    </div>
  );
}
