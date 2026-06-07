'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/DataTable';
import { ProjectStatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProjectForm } from '@/features/projects/ProjectForm';
import { useProjects, useDeleteProject } from '@/features/projects/hooks';
import { useAuth } from '@/lib/auth';
import { canManageProjects } from '@/lib/permissions';
import { formatDate, isOverdue } from '@/lib/format';
import type { Project, ProjectStatus } from '@/types';

const STATUSES: { value: ProjectStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const canManage = canManageProjects(user);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [sort, setSort] = useState<'recent' | 'deadline' | 'updated' | 'name'>('recent');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const { data, isLoading } = useProjects({
    search: search.trim() || undefined,
    status: status === 'ALL' ? undefined : status,
    sort,
    page,
    limit: 10,
  });

  const remove = useDeleteProject();

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast.success(`Deleted "${confirmDelete.name}"`);
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (p) => (
        <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
          {p.name}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <ProjectStatusBadge status={p.status} />,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (p) => (
        <span className={isOverdue(p.deadline, p.status) ? 'text-red-600 font-medium' : ''}>
          {formatDate(p.deadline)}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Last updated',
      render: (p) => <span className="text-muted-foreground">{formatDate(p.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      render: (p) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(p);
                setFormOpen(true);
              }}
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(p);
              }}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team&apos;s projects and track their progress.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> New project
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search projects…"
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
            setStatus(v as ProjectStatus | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Latest created</SelectItem>
            <SelectItem value="deadline">Nearest deadline</SelectItem>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="name">Name (A→Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable<Project>
        columns={columns}
        rows={data?.rows}
        rowKey={(p) => p.id}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        empty="No projects yet."
      />

      <ProjectForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        project={editing}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={`Delete "${confirmDelete?.name ?? ''}"?`}
        description="The project and its tasks will be hidden from all lists. An admin or PM can restore it later."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
