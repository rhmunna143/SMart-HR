'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TaskStatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { TaskForm } from '@/features/tasks/TaskForm';
import { useTask, useUpdateTaskStatus } from '@/features/tasks/hooks';
import { useMembers } from '@/features/members/hooks';
import { CommentThread } from '@/features/comments/CommentThread';
import { AttachmentPanel } from '@/features/attachments/AttachmentPanel';
import { useAuth } from '@/lib/auth';
import { canManageTasks } from '@/lib/permissions';
import { formatDate, formatDateTime } from '@/lib/format';
import { ApiError } from '@/lib/api';
import type { TaskStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PageProps {
  params: Promise<{ id: string }>;
}

type Tab = 'comments' | 'attachments';

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const canManage = canManageTasks(user);

  const { data: task, isLoading, error } = useTask(id);
  const { data: members } = useMembers();
  const statusMut = useUpdateTaskStatus();

  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('comments');

  const assignee = task?.assignee_id
    ? members?.find((m) => m.id === task.assignee_id)
    : null;

  const canChangeStatus =
    canManage || (user && task ? task.assignee_id === user.id : false);

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return;
    try {
      await statusMut.mutateAsync({ id: task.id, status });
      toast.success(`Status updated`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading task…</p>;
  }
  if (error || !task) {
    return (
      <div className="space-y-3">
        <Link
          href="/tasks"
          className="inline-flex items-center text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to tasks
        </Link>
        <p className="text-sm text-red-600">Task not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/tasks"
        className="inline-flex items-center text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to tasks
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          <div className="flex items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      {/* Details card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Assignee</p>
            <p className="font-medium">{assignee?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due date</p>
            <p className="font-medium">{formatDate(task.due_date)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p>{formatDateTime(task.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last updated</p>
            <p>{formatDateTime(task.updated_at)}</p>
          </div>
          {task.description && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
          {canChangeStatus && (
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Select value={task.status} onValueChange={(v) => v && handleStatusChange(v as TaskStatus)}>
                <SelectTrigger className="mt-1 h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">Todo</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Comments | Attachments */}
      <div className="space-y-4">
        <div className="flex gap-1 rounded-md border p-1 w-fit">
          <Button
            size="sm"
            variant={tab === 'comments' ? 'default' : 'ghost'}
            onClick={() => setTab('comments')}
          >
            Comments
          </Button>
          <Button
            size="sm"
            variant={tab === 'attachments' ? 'default' : 'ghost'}
            onClick={() => setTab('attachments')}
          >
            Attachments
          </Button>
        </div>

        <Separator />

        {tab === 'comments' && <CommentThread taskId={id} />}
        {tab === 'attachments' && <AttachmentPanel taskId={id} />}
      </div>

      <TaskForm
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        defaultProjectId={task.project_id}
      />
    </div>
  );
}
