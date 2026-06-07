'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MembersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Workload, project assignments, and member management ship in M3.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          M3 wires the project_members table to project-level membership management and adds a workload
          dashboard per member.
        </CardContent>
      </Card>
    </div>
  );
}
