'use client';
import { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Inbox, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCaptureInbox, useDeleteInbox, useInbox } from '@/hooks/use-inbox';

export default function InboxPage() {
  const { data: items, isLoading } = useInbox();
  const capture = useCaptureInbox();
  const remove = useDeleteInbox();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const selected = items?.find((i) => i._id === selectedId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await capture.mutateAsync({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      toast.success('Captured to inbox');
    } catch {
      toast.error('Could not capture');
    }
  }

  return (
    <main className="container max-w-6xl py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture an idea fast — convert it into a card whenever you&apos;re ready.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left: list */}
        <div className="overflow-hidden rounded-xl border bg-card">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : !items || items.length === 0 ? (
            <EmptyInbox />
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item._id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-accent/40',
                      selectedId === item._id && 'bg-accent/40',
                    )}
                  >
                    <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Inbox className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      {item.body && (
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {item.body}
                        </div>
                      )}
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove.mutate(item._id);
                        if (selectedId === item._id) setSelectedId(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: detail / new */}
        <aside className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-2 rounded-xl border bg-card p-4 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick capture
            </div>
            <Input
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Notes (optional)"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={!title.trim() || capture.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Capture
            </Button>
          </form>

          {selected && (
            <div className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Selected item
              </div>
              <h3 className="text-base font-semibold">{selected.title}</h3>
              {selected.body && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selected.body}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Converting an inbox item to a board card is wired in the backend
                (<code>POST /api/inbox/:id/convert</code>); the picker UI lands in Phase 9.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function EmptyInbox() {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white shadow-glow">
        <Inbox className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Your inbox is empty</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Capture quick thoughts on the right — convert them into proper cards later.
      </p>
    </div>
  );
}
