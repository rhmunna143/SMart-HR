'use client';

import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { useSettings, useUpdateVisibility } from '@/features/settings/hooks';
import type { VisibilitySetting } from '@/features/settings/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const updateVisibility = useUpdateVisibility();

  if (!isAdmin(user)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-red-600">Admins only.</p>
      </div>
    );
  }

  const handleVisibilityChange = async (value: string) => {
    try {
      await updateVisibility.mutateAsync(value as VisibilitySetting);
      toast.success('Setting saved');
    } catch {
      toast.error('Could not save setting');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Admin-only configuration for this workspace.
        </p>
      </div>

      <Separator />

      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Member Visibility</CardTitle>
            <CardDescription>
              Controls what Team Members see in the project and task lists.{' '}
              <strong>ASSIGNED ONLY</strong> shows only projects where they are a member or tasks
              assigned to them. <strong>ALL</strong> shows every project and task in the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 w-48 animate-pulse rounded bg-muted" />
            ) : (
              <Select
                value={settings?.team_member_project_visibility ?? 'ASSIGNED_ONLY'}
                onValueChange={(v) => v && handleVisibilityChange(v)}
                disabled={updateVisibility.isPending}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNED_ONLY">Assigned only</SelectItem>
                  <SelectItem value="ALL">All (unrestricted)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
