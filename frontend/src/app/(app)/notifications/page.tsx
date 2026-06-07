'use client';

import { CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/features/notifications/hooks';

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications(50);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Could not update notifications');
    }
  };

  const handleMarkOne = async (id: string, read: boolean) => {
    if (read) return;
    try {
      await markRead.mutateAsync(id);
    } catch {
      toast.error('Could not mark notification as read');
    }
  };

  const rows = data?.rows ?? [];
  const unread = data?.unread ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={markAll.isPending}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              You have no notifications yet.
            </p>
          )}
          {!isLoading && rows.length > 0 && (
            <ul className="divide-y">
              {rows.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleMarkOne(n.id, n.read)}
                  className={cn(
                    'flex items-start gap-3 px-1 py-3 transition-colors',
                    !n.read && 'cursor-pointer hover:bg-muted/40',
                  )}
                >
                  {/* Unread dot */}
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      n.read ? 'bg-transparent' : 'bg-primary',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', !n.read && 'font-medium')}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
