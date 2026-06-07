'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/DataTable';
import { TaskStatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, isOverdue } from '@/lib/format';
import type { Task, TaskStatus, User } from '@/types';
import type { PageMeta } from '@/lib/api';

interface Props {
  rows: Task[] | undefined;
  meta?: PageMeta;
  loading?: boolean;
  page: number;
  onPageChange: (page: number) => void;
  membersById: Record<string, User>;
  canManage: boolean;
  canChangeStatus: (task: Task) => boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

export function TaskTable({
  rows,
  meta,
  loading,
  onPageChange,
  membersById,
  canManage,
  canChangeStatus,
  onEdit,
  onDelete,
  onStatusChange,
}: Props) {
  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (t) => <span className="font-medium">{t.title}</span>,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (t) => (t.assignee_id && membersById[t.assignee_id]?.name) || '—',
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => <PriorityBadge priority={t.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) =>
        canChangeStatus(t) ? (
          <Select
            value={t.status}
            onValueChange={(v) => onStatusChange(t, v as TaskStatus)}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">Todo</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <TaskStatusBadge status={t.status} />
        ),
    },
    {
      key: 'due',
      header: 'Due',
      render: (t) => (
        <span className={isOverdue(t.due_date, t.status) ? 'text-red-600 font-medium' : ''}>
          {formatDate(t.due_date)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      render: (t) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(t)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(t)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <DataTable<Task>
      columns={columns}
      rows={rows}
      rowKey={(t) => t.id}
      loading={loading}
      meta={meta}
      onPageChange={onPageChange}
      empty="No tasks yet."
    />
  );
}
