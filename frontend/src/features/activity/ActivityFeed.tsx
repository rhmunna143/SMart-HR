'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivity } from './hooks';
import { formatDateTime } from '@/lib/format';

function relative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDateTime(iso);
}

interface Props {
  limit?: number;
  title?: string;
}

export function ActivityFeed({ limit = 10, title = 'Recent activity' }: Props) {
  const { data, isLoading, error } = useActivity(limit);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-red-600">Couldn&apos;t load activity.</p>}
        {!isLoading && !error && (
          <ul className="divide-y">
            {(data ?? []).length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">No activity yet.</li>
            )}
            {(data ?? []).map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{entry.message}</p>
                  <p className="text-xs text-muted-foreground" title={formatDateTime(entry.created_at)}>
                    {relative(entry.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
