'use client';

import { useAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { user } = useAuth();
  if (!isAdmin(user)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-red-600">Admins only.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Admin-configurable settings, including team member visibility, ship in M5.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team Member visibility</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Soon: switch between <code>ASSIGNED_ONLY</code> (default) and <code>ALL</code> for what
          Team Members see in the project/task lists.
        </CardContent>
      </Card>
    </div>
  );
}
