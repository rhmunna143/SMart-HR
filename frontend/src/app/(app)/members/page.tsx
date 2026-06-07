'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/DataTable';
import { useMembersOverview } from '@/features/members/hooks';
import type { MemberOverview } from '@/features/members/api';
import { MemberWorkloadDialog } from '@/features/members/MemberWorkloadDialog';

const columns: Column<MemberOverview>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (m) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{m.name}</p>
        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
      </div>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    render: (m) => <Badge variant="outline">{m.role.replace('_', ' ')}</Badge>,
  },
  {
    key: 'total',
    header: 'Total',
    className: 'text-right',
    render: (m) => <span className="font-medium">{m.total_tasks}</span>,
  },
  {
    key: 'completed',
    header: 'Completed',
    className: 'text-right',
    render: (m) => (
      <span className="text-emerald-700 dark:text-emerald-300">{m.completed_tasks}</span>
    ),
  },
  {
    key: 'pending',
    header: 'Pending',
    className: 'text-right',
    render: (m) => (
      <span className="text-amber-700 dark:text-amber-300">{m.pending_tasks}</span>
    ),
  },
  {
    key: 'overdue',
    header: 'Overdue',
    className: 'text-right',
    render: (m) =>
      m.overdue_tasks > 0 ? (
        <span className="font-semibold text-red-600 dark:text-red-400">{m.overdue_tasks}</span>
      ) : (
        <span className="text-muted-foreground">0</span>
      ),
  },
];

export default function MembersPage() {
  const { data, isLoading } = useMembersOverview();
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Workload summary across all users. Click a row to see per-project breakdown.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Workload overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={data}
            loading={isLoading}
            rowKey={(m) => m.id}
            empty="No members yet."
            onRowClick={(m) => setOpenUserId(m.id)}
          />
        </CardContent>
      </Card>
      <MemberWorkloadDialog userId={openUserId} onClose={() => setOpenUserId(null)} />
    </div>
  );
}
