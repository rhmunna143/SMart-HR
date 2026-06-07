'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">In-app notifications ship in M5.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          We&apos;ll surface assignments, status changes, and project updates here with an unread badge in
          the sidebar.
        </CardContent>
      </Card>
    </div>
  );
}
