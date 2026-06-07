'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriorityBadge } from '@/components/StatusBadge';
import { formatDate, isOverdue } from '@/lib/format';
import type { Task, TaskStatus, User } from '@/types';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'TODO', title: 'Todo' },
  { status: 'IN_PROGRESS', title: 'In progress' },
  { status: 'COMPLETED', title: 'Completed' },
];

interface Props {
  tasks: Task[];
  membersById: Record<string, User>;
  canManage: boolean;
  onEdit: (task: Task) => void;
}

export function TaskBoard({ tasks, membersById, canManage, onEdit }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map(({ status, title }) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <Card key={status} className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {title} <span className="ml-1 text-xs text-muted-foreground">({items.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground">No tasks.</p>
              )}
              {items.map((t) => (
                <div
                  key={t.id}
                  className="rounded-md border bg-background p-3 text-sm shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{t.title}</p>
                    {canManage && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 -mt-1 -mr-1" onClick={() => onEdit(t)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t.assignee_id ? (membersById[t.assignee_id]?.name ?? 'Unknown') : 'Unassigned'}
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  {t.due_date && (
                    <p
                      className={`mt-1 text-xs ${isOverdue(t.due_date, t.status) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
                    >
                      Due {formatDate(t.due_date)}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
