'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCard } from '@/hooks/use-cards';

export function AddCardForm({ boardId, listId }: { boardId: string; listId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const createCard = useCreateCard(boardId);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createCard.mutate({ listId, title: title.trim() });
    setTitle('');
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Add a card
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg bg-card p-2 shadow-soft">
      <Textarea
        autoFocus
        placeholder="Enter a title for this card…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e as unknown as React.FormEvent);
          }
          if (e.key === 'Escape') {
            setOpen(false);
            setTitle('');
          }
        }}
        className="min-h-[60px] resize-none border-0 p-2 shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add card
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
