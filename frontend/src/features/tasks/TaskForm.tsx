'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApiError } from '@/lib/api';
import { useMembers } from '@/features/members/hooks';
import { useProjects } from '@/features/projects/hooks';
import { useCreateTask, useUpdateTask } from './hooks';
import type { Task, TaskPriority, TaskStatus } from '@/types';

interface FormShape {
  project_id: string;
  title: string;
  description: string;
  assignee_id: string; // '' = unassigned
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultProjectId?: string;
  lockProject?: boolean;
}

const UNASSIGNED = '__none__';

export function TaskForm({ open, onOpenChange, task, defaultProjectId, lockProject }: Props) {
  const isEdit = !!task;
  const create = useCreateTask();
  const update = useUpdateTask(task?.id ?? '');

  const projectsQuery = useProjects({ limit: 100, sort: 'name' });
  const membersQuery = useMembers();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({
    defaultValues: {
      project_id: defaultProjectId ?? '',
      title: '',
      description: '',
      assignee_id: '',
      due_date: '',
      priority: 'MEDIUM',
      status: 'TODO',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        project_id: task?.project_id ?? defaultProjectId ?? '',
        title: task?.title ?? '',
        description: task?.description ?? '',
        assignee_id: task?.assignee_id ?? '',
        due_date: task?.due_date ?? '',
        priority: task?.priority ?? 'MEDIUM',
        status: task?.status ?? 'TODO',
      });
    }
  }, [open, task, defaultProjectId, reset]);

  const onSubmit = async (values: FormShape) => {
    try {
      if (isEdit && task) {
        const payload = {
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          assignee_id: values.assignee_id ? values.assignee_id : null,
          due_date: values.due_date || undefined,
          priority: values.priority,
          status: values.status,
        };
        await update.mutateAsync(payload);
        toast.success('Task updated');
      } else {
        if (!values.project_id) {
          setError('project_id', { message: 'Project is required' });
          return;
        }
        const payload = {
          project_id: values.project_id,
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          assignee_id: values.assignee_id || undefined,
          due_date: values.due_date || undefined,
          priority: values.priority,
          status: values.status,
        };
        await create.mutateAsync(payload);
        toast.success('Task created');
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        for (const [field, message] of Object.entries(err.errors)) {
          setError(field as keyof FormShape, { message });
        }
        if (err.message && !Object.keys(err.errors).length) toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : 'Save failed');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the task details.' : 'Add a task to one of your projects.'}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {!isEdit && (
            <div className="grid gap-1.5">
              <Label htmlFor="project_id">Project</Label>
              <Controller
                control={control}
                name="project_id"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={lockProject}
                  >
                    <SelectTrigger id="project_id">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsQuery.data?.rows.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.project_id && (
                <p className="text-sm text-red-600">{errors.project_id.message}</p>
              )}
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" autoFocus {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="assignee_id">Assignee</Label>
              <Controller
                control={control}
                name="assignee_id"
                render={({ field }) => (
                  <Select
                    value={field.value === '' ? UNASSIGNED : field.value}
                    onValueChange={(v) => field.onChange(v === UNASSIGNED ? '' : v)}
                  >
                    <SelectTrigger id="assignee_id">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {membersQuery.data?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assignee_id && (
                <p className="text-sm text-red-600">{errors.assignee_id.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" type="date" {...register('due_date')} />
              {errors.due_date && (
                <p className="text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">Todo</SelectItem>
                      <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
