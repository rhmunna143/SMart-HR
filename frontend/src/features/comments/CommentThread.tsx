'use client';

import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useComments, useCreateComment, useDeleteComment } from './hooks';

interface Props {
  taskId: string;
}

export function CommentThread({ taskId }: Props) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useComments(taskId);
  const create = useCreateComment(taskId);
  const remove = useDeleteComment(taskId);
  const [draft, setDraft] = useState('');

  const canDelete = (authorId: string) =>
    user?.id === authorId ||
    user?.role === 'ADMIN' ||
    user?.role === 'PROJECT_MANAGER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    try {
      await create.mutateAsync(body);
      setDraft('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not post comment');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete comment');
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading comments…</p>}
      {!isLoading && (
        <ul className="space-y-3">
          {(comments ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">No comments yet. Be the first!</li>
          )}
          {(comments ?? []).map((c) => (
            <li key={c.id} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
              {/* Avatar initials */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {c.author_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author_name}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
              </div>
              {canDelete(c.author_id) && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(c.id)}
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Post new comment */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Write a comment…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!draft.trim() || create.isPending}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {create.isPending ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
