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
import { useCreateProject, useUpdateProject } from './hooks';
import type { Project, ProjectStatus } from '@/types';

interface FormShape {
  name: string;
  description: string;
  deadline: string;
  status: ProjectStatus;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

export function ProjectForm({ open, onOpenChange, project }: Props) {
  const isEdit = !!project;
  const create = useCreateProject();
  const update = useUpdateProject(project?.id ?? '');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({
    defaultValues: {
      name: '',
      description: '',
      deadline: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name ?? '',
        description: project?.description ?? '',
        deadline: project?.deadline ?? '',
        status: project?.status ?? 'ACTIVE',
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (values: FormShape) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      deadline: values.deadline || undefined,
      status: values.status,
    };
    try {
      if (isEdit && project) {
        await update.mutateAsync(payload);
        toast.success('Project updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Project created');
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        for (const [field, message] of Object.entries(err.errors)) {
          setError(field as keyof FormShape, { message });
        }
      } else {
        toast.error(err instanceof Error ? err.message : 'Save failed');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the project details.' : 'Create a new project for your team.'}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoFocus {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register('description')} />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" {...register('deadline')} />
              {errors.deadline && (
                <p className="text-sm text-red-600">{errors.deadline.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ON_HOLD">On hold</SelectItem>
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
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
