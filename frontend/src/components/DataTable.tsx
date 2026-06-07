'use client';

import { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: T) => ReactNode;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  meta?: PageMeta;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty,
  meta,
  onPageChange,
  onRowClick,
}: Props<T>) {
  const isLoading = loading && !rows;
  const showEmpty = !isLoading && rows && rows.length === 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-10">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {showEmpty && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-10">
                  {empty ?? 'No results.'}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              rows?.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-muted/60')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      {meta && meta.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
