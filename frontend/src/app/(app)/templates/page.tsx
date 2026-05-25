'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Layers, Plus, Sparkles } from 'lucide-react';
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
import { useTemplates, useCreateBoardFromTemplate, type Template } from '@/hooks/use-templates';
import { useCreateWorkspace, useWorkspaces } from '@/hooks/use-boards';

export default function TemplatesPage() {
  const router = useRouter();
  const { data: templates, isLoading } = useTemplates();
  const { data: workspaces } = useWorkspaces();
  const createWs = useCreateWorkspace();
  const createBoard = useCreateBoardFromTemplate();

  const [selected, setSelected] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [wsId, setWsId] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !title.trim()) return;
    try {
      let workspaceId = wsId ?? workspaces?.[0]?._id;
      if (!workspaceId) {
        const ws = await createWs.mutateAsync({ name: 'My Workspace' });
        workspaceId = ws._id;
      }
      const board = await createBoard.mutateAsync({
        templateId: selected._id,
        workspaceId,
        title: title.trim(),
      });
      toast.success('Board created from template');
      setSelected(null);
      setTitle('');
      router.push(`/boards/${board._id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <main className="container max-w-6xl py-8">
      <div className="flex items-end gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl brand-gradient text-white shadow-glow">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Skip the blank-page problem. Pick a starting point.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[5/3] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-20 text-center">
          <Sparkles className="h-7 w-7 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">No templates yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Templates seed automatically on first request. Refresh the page in a moment.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => {
                setSelected(t);
                setTitle(t.name);
              }}
              className="group overflow-hidden rounded-xl border bg-card text-left shadow-soft transition hover:shadow-glow"
            >
              <div
                className="aspect-[5/2.4] flex items-end p-3"
                style={
                  t.background?.type === 'gradient'
                    ? { backgroundImage: t.background.value }
                    : { backgroundColor: t.background?.value ?? '#795DFF' }
                }
              >
                <div className="flex w-full gap-1.5 opacity-90">
                  {(t.structure?.lists ?? []).slice(0, 5).map((l, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-md bg-white/90 px-1.5 py-1 text-[9px] font-semibold text-foreground"
                    >
                      {l.title}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t.name}</h3>
                  {t.category && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      {t.category}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use template &ldquo;{selected?.name}&rdquo;</DialogTitle>
            <DialogDescription>
              We&apos;ll create a board with all the lists from this template.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Board title</Label>
              <Input
                id="title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {workspaces && workspaces.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="ws">Workspace</Label>
                <select
                  id="ws"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={wsId ?? workspaces[0]?._id}
                  onChange={(e) => setWsId(e.target.value)}
                >
                  {workspaces.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim() || createBoard.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {createBoard.isPending ? 'Creating…' : 'Create board'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
