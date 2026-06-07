'use client';

import { useRef } from 'react';
import { Download, Paperclip, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDateTime } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { downloadAttachment } from './api';
import { useAttachments, useDeleteAttachment, useUploadAttachment } from './hooks';
import { useState } from 'react';

const MAX_MB = 5;

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  taskId: string;
}

export function AttachmentPanel({ taskId }: Props) {
  const { user } = useAuth();
  const { data: attachments, isLoading } = useAttachments(taskId);
  const upload = useUploadAttachment(taskId);
  const remove = useDeleteAttachment(taskId);

  const fileRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canDelete = (uploadedById: string) =>
    user?.id === uploadedById ||
    user?.role === 'ADMIN' ||
    user?.role === 'PROJECT_MANAGER';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }
    try {
      await upload.mutateAsync(file);
      toast.success(`Uploaded "${file.name}"`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      await downloadAttachment(id, filename);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await remove.mutateAsync(deletingId);
      toast.success('Attachment deleted');
      setDeletingId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete attachment');
    }
  };

  const deletingName =
    attachments?.find((a) => a.id === deletingId)?.filename ?? '';

  return (
    <div className="space-y-3">
      {/* Upload */}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {upload.isPending ? 'Uploading…' : 'Upload file'}
        </Button>
        <span className="text-xs text-muted-foreground">Max {MAX_MB} MB</span>
      </div>

      {/* List */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && (
        <ul className="space-y-2">
          {(attachments ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">No attachments yet.</li>
          )}
          {(attachments ?? []).map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtBytes(a.size_bytes)} · {a.uploader_name} · {formatDateTime(a.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleDownload(a.id, a.filename)}
                  aria-label="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {canDelete(a.uploaded_by_id) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingId(a.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title={`Delete "${deletingName}"?`}
        description="This file will be permanently removed from the task."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
