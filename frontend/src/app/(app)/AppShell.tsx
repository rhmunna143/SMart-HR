'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, FolderKanban, ListChecks, Users, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-muted/30">
      <aside className="flex flex-col border-r bg-background px-4 py-6">
        <div className="mb-6 px-2">
          <p className="text-lg font-semibold">Smart HR</p>
          <p className="text-xs text-muted-foreground">{user.role.replace('_', ' ')}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {user.role === 'ADMIN' && (
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                pathname.startsWith('/settings')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          )}
        </nav>
        <div className="mt-4 border-t pt-4">
          <div className="mb-2 px-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
