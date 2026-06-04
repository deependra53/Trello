'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateList } from '@/hooks/use-cards';

export function AddListForm({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const createList = useCreateList(boardId);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createList.mutate(title.trim());
    setTitle('');
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-72 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/15 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0"
      >
        <Plus className="h-4 w-4" />
        Add another list
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-72 shrink-0 animate-scale-in space-y-2 rounded-xl border border-border/60 bg-muted p-2 shadow-md"
    >
      <Input
        autoFocus
        placeholder="Enter list title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setTitle('');
          }
        }}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add list
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setOpen(false);
            setTitle('');
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
