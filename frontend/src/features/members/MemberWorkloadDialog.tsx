'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useMemberWorkload } from './hooks';

interface Props {
  userId: string | null;
  onClose: () => void;
}

export function MemberWorkloadDialog({ userId, onClose }: Props) {
  const { data, isLoading, error } = useMemberWorkload(userId);
  const open = !!userId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data ? `${data.user.name}'s workload` : 'Workload'}</DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-red-600">Couldn&apos;t load workload.</p>}
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Total" value={data.total} />
              <Stat label="Completed" value={data.completed} tone="emerald" />
              <Stat label="In progress" value={data.in_progress} tone="blue" />
              <Stat label="Overdue" value={data.overdue} tone="red" />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                By project
              </p>
              {data.by_project.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
              ) : (
                <ul className="space-y-1">
                  {data.by_project.map((p) => (
                    <li
                      key={p.project_id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{p.project_name}</span>
                      <span className="flex items-center gap-1 text-xs">
                        <Badge variant="outline">{p.total} total</Badge>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200">
                          {p.completed} done
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200">
                          {p.pending} pending
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'emerald' | 'blue' | 'red';
}) {
  const toneCls =
    tone === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'blue'
        ? 'text-blue-700 dark:text-blue-300'
        : tone === 'red'
          ? 'text-red-700 dark:text-red-300'
          : '';
  return (
    <div className="rounded-md border p-3 text-center">
      <p className={`text-xl font-semibold ${toneCls}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
