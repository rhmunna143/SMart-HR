import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: number | string;
  icon?: ReactNode;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

const valueClasses: Record<NonNullable<Props['variant']>, string> = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

export function KpiCard({ title, value, icon, description, variant = 'default', loading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-9 w-16 animate-pulse rounded bg-muted" />
        ) : (
          <p className={cn('text-3xl font-bold tabular-nums', valueClasses[variant])}>{value}</p>
        )}
        {description && !loading && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
