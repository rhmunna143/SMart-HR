'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TaskForm } from '@/features/tasks/TaskForm';
import { TaskTable } from '@/features/tasks/TaskTable';
import { TaskBoard } from '@/features/tasks/TaskBoard';
import {
  useTasks,
  useUpdateTaskStatus,
  useDeleteTask,
} from '@/features/tasks/hooks';
import { useMembers } from '@/features/members/hooks';
import { useAuth } from '@/lib/auth';
import { canManageTasks } from '@/lib/permissions';
import { ApiError } from '@/lib/api';
import type { Task, TaskPriority, TaskStatus, User } from '@/types';

export default function TasksPage() {
  const { user } = useAuth();
  const canManage = canManageTasks(user);

  const [view, setView] = useState<'table' | 'board'>('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [priority, setPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [deadline, setDeadline] = useState<'ALL' | 'upcoming' | 'overdue'>('ALL');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);

  const params = {
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    priority: priority === 'ALL' ? undefined : priority,
    deadline: deadline === 'ALL' ? undefined : deadline,
    sort: 'recent' as const,
    page,
    limit: view === 'board' ? 100 : 10,
  };

  const { data, isLoading } = useTasks(params);
  const { data: members } = useMembers();
  const membersById = useMemo(() => {
    const map: Record<string, User> = {};
    (members ?? []).forEach((m) => {
      map[m.id] = m;
    });
    return map;
  }, [members]);

  const statusMut = useUpdateTaskStatus();
  const remove = useDeleteTask();

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await statusMut.mutateAsync({ id: task.id, status: newStatus });
      toast.success(`"${task.title}" → ${newStatus.replace('_', ' ').toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast.success(`Deleted "${confirmDelete.title}"`);
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const canChangeStatus = (task: Task) =>
    canManage || (user ? task.assignee_id === user.id : false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Track what your team is working on across all projects.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> New task
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-64"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as typeof status);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="TODO">Todo</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priority}
          onValueChange={(v) => {
            setPriority(v as typeof priority);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={deadline}
          onValueChange={(v) => {
            setDeadline(v as typeof deadline);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any deadline</SelectItem>
            <SelectItem value="upcoming">Upcoming (7d)</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-1 rounded-md border p-1">
          <Button
            size="sm"
            variant={view === 'table' ? 'default' : 'ghost'}
            onClick={() => setView('table')}
          >
            Table
          </Button>
          <Button
            size="sm"
            variant={view === 'board' ? 'default' : 'ghost'}
            onClick={() => setView('board')}
          >
            Board
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <TaskTable
          rows={data?.rows}
          meta={data?.meta}
          loading={isLoading}
          page={page}
          onPageChange={setPage}
          membersById={membersById}
          canManage={canManage}
          canChangeStatus={canChangeStatus}
          onEdit={(t) => {
            setEditing(t);
            setFormOpen(true);
          }}
          onDelete={(t) => setConfirmDelete(t)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TaskBoard
          tasks={data?.rows ?? []}
          membersById={membersById}
          canManage={canManage}
          onEdit={(t) => {
            setEditing(t);
            setFormOpen(true);
          }}
        />
      )}

      <TaskForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        task={editing}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={`Delete "${confirmDelete?.title ?? ''}"?`}
        description="The task will be hidden from all lists. An admin or PM can restore it later."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
