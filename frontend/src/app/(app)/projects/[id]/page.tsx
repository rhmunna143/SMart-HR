'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectStatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProjectForm } from '@/features/projects/ProjectForm';
import { TaskForm } from '@/features/tasks/TaskForm';
import { TaskTable } from '@/features/tasks/TaskTable';
import { TaskBoard } from '@/features/tasks/TaskBoard';
import { useProject } from '@/features/projects/hooks';
import {
  useTasks,
  useDeleteTask,
  useUpdateTaskStatus,
} from '@/features/tasks/hooks';
import { useMembers } from '@/features/members/hooks';
import { useAuth } from '@/lib/auth';
import { canManageProjects, canManageTasks } from '@/lib/permissions';
import { ApiError } from '@/lib/api';
import { formatDate, isOverdue } from '@/lib/format';
import type { Task, TaskStatus, User } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const canManageProj = canManageProjects(user);
  const canManageTask = canManageTasks(user);

  const [view, setView] = useState<'table' | 'board'>('table');
  const [page, setPage] = useState(1);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);

  const projectQuery = useProject(id);
  const tasksQuery = useTasks({
    projectId: id,
    sort: 'priority',
    page,
    limit: view === 'board' ? 100 : 10,
  });
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
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteTask) return;
    try {
      await remove.mutateAsync(confirmDeleteTask.id);
      toast.success(`Deleted "${confirmDeleteTask.title}"`);
      setConfirmDeleteTask(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (projectQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading project…</p>;
  }
  if (projectQuery.error || !projectQuery.data) {
    return (
      <div className="space-y-3">
        <Link href="/projects" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to projects
        </Link>
        <p className="text-sm text-red-600">Project not found.</p>
      </div>
    );
  }

  const project = projectQuery.data;
  const canChangeStatus = (task: Task) =>
    canManageTask || (user ? task.assignee_id === user.id : false);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to projects
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        {canManageProj && (
          <Button variant="outline" onClick={() => setEditProjectOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit project
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Deadline</p>
            <p className={isOverdue(project.deadline, project.status) ? 'text-red-600 font-medium' : ''}>
              {formatDate(project.deadline)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p>{formatDate(project.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last updated</p>
            <p>{formatDate(project.updated_at)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md border p-1">
            <Button size="sm" variant={view === 'table' ? 'default' : 'ghost'} onClick={() => setView('table')}>
              Table
            </Button>
            <Button size="sm" variant={view === 'board' ? 'default' : 'ghost'} onClick={() => setView('board')}>
              Board
            </Button>
          </div>
          {canManageTask && (
            <Button
              onClick={() => {
                setEditingTask(null);
                setTaskFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> New task
            </Button>
          )}
        </div>
      </div>

      {view === 'table' ? (
        <TaskTable
          rows={tasksQuery.data?.rows}
          meta={tasksQuery.data?.meta}
          loading={tasksQuery.isLoading}
          page={page}
          onPageChange={setPage}
          membersById={membersById}
          canManage={canManageTask}
          canChangeStatus={canChangeStatus}
          onEdit={(t) => {
            setEditingTask(t);
            setTaskFormOpen(true);
          }}
          onDelete={(t) => setConfirmDeleteTask(t)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TaskBoard
          tasks={tasksQuery.data?.rows ?? []}
          membersById={membersById}
          canManage={canManageTask}
          onEdit={(t) => {
            setEditingTask(t);
            setTaskFormOpen(true);
          }}
        />
      )}

      <ProjectForm
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        project={project}
      />

      <TaskForm
        open={taskFormOpen}
        onOpenChange={(o) => {
          setTaskFormOpen(o);
          if (!o) setEditingTask(null);
        }}
        task={editingTask}
        defaultProjectId={project.id}
        lockProject
      />

      <ConfirmDialog
        open={!!confirmDeleteTask}
        onOpenChange={(o) => !o && setConfirmDeleteTask(null)}
        title={`Delete "${confirmDeleteTask?.title ?? ''}"?`}
        description="The task will be hidden from all lists. An admin or PM can restore it later."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
