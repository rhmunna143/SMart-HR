'use client';

import { useMemo, useState } from 'react';
import { Plus, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  useAddProjectMember,
  useMembers,
  useProjectMembers,
  useRemoveProjectMember,
} from './hooks';
import { ApiError } from '@/lib/api';
import type { User } from '@/types';

interface Props {
  projectId: string;
  canManage: boolean;
}

export function ProjectMembersCard({ projectId, canManage }: Props) {
  const projectMembers = useProjectMembers(projectId);
  const allMembers = useMembers();
  const add = useAddProjectMember(projectId);
  const remove = useRemoveProjectMember(projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [pickedUserId, setPickedUserId] = useState<string>('');
  const [removing, setRemoving] = useState<User | null>(null);

  const memberIds = useMemo(
    () => new Set((projectMembers.data ?? []).map((u) => u.id)),
    [projectMembers.data],
  );
  const candidates = useMemo(
    () => (allMembers.data ?? []).filter((u) => !memberIds.has(u.id)),
    [allMembers.data, memberIds],
  );

  const handleAdd = async () => {
    if (!pickedUserId) return;
    try {
      await add.mutateAsync(pickedUserId);
      toast.success('Member added');
      setPickedUserId('');
      setAddOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not add member');
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success(`Removed ${removing.name}`);
      setRemoving(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove member');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Members
        </CardTitle>
        {canManage && (
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {projectMembers.isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {!projectMembers.isLoading && (
          <ul className="flex flex-col gap-2">
            {(projectMembers.data ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">No members yet.</li>
            )}
            {(projectMembers.data ?? []).map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {m.role.replace('_', ' ')}
                  </Badge>
                  {canManage && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setRemoving(m)}
                      aria-label={`Remove ${m.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Add member to project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Every user is already a member of this project.
              </p>
            ) : (
              <Select value={pickedUserId} onValueChange={(v) => setPickedUserId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a user…" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={add.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!pickedUserId || add.isPending}
            >
              {add.isPending ? 'Adding…' : 'Add member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.name ?? ''}?`}
        description="They will no longer see this project unless tasks are assigned to them directly."
        confirmLabel="Remove"
        destructive
        loading={remove.isPending}
        onConfirm={handleRemove}
      />
    </Card>
  );
}
