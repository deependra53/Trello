'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useCreateBoard, useCreateWorkspace, useWorkspaces } from '@/hooks/use-boards';

interface BG {
  type: 'color' | 'gradient';
  value: string;
}
const BACKGROUNDS: readonly BG[] = [
  { type: 'color', value: '#795DFF' },
  { type: 'color', value: '#22A186' },
  { type: 'color', value: '#F2994A' },
  { type: 'color', value: '#EB5757' },
  { type: 'color', value: '#2D9CDB' },
  { type: 'gradient', value: 'linear-gradient(135deg,#795DFF,#9B7BFF)' },
  { type: 'gradient', value: 'linear-gradient(135deg,#FF6B6B,#FFA8A8)' },
  { type: 'gradient', value: 'linear-gradient(135deg,#11998E,#38EF7D)' },
];

interface Props {
  triggerClassName?: string;
  workspaceId?: string;
  children?: React.ReactNode;
}

export function CreateBoardDialog({ triggerClassName, workspaceId, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [bg, setBg] = useState<BG>(BACKGROUNDS[0]!);
  const [selectedWs, setSelectedWs] = useState<string | undefined>(workspaceId);

  const { data: workspaces } = useWorkspaces();
  const createWs = useCreateWorkspace();
  const createBoard = useCreateBoard();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      let wsId = selectedWs;
      if (!wsId) {
        if (workspaces && workspaces.length > 0) {
          wsId = workspaces[0]?._id;
        } else {
          const ws = await createWs.mutateAsync({ name: 'My Workspace' });
          wsId = ws._id;
        }
      }
      if (!wsId) throw new Error('No workspace');
      const board = await createBoard.mutateAsync({
        workspaceId: wsId,
        title: title.trim(),
        background: bg,
      });
      toast.success('Board created');
      setOpen(false);
      setTitle('');
      router.push(`/boards/${board._id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className={triggerClassName}>
            <Plus className="mr-2 h-4 w-4" />
            Create board
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new board</DialogTitle>
          <DialogDescription>Pick a name and a background to get started.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div
            className="relative h-28 overflow-hidden rounded-xl border border-border/60 shadow-sm"
            style={
              bg.type === 'gradient'
                ? { backgroundImage: bg.value }
                : { backgroundColor: bg.value }
            }
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/5 to-transparent" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-base font-semibold tracking-tight text-white drop-shadow">
                {title.trim() || 'Board preview'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="board-title">Board title</Label>
            <Input
              id="board-title"
              autoFocus
              placeholder="e.g. Q3 Roadmap"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {workspaces && workspaces.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="ws">Workspace</Label>
              <select
                id="ws"
                value={selectedWs ?? workspaces[0]?._id}
                onChange={(e) => setSelectedWs(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
              >
                {workspaces.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Background</Label>
            <div className="grid grid-cols-4 gap-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  aria-label={`background ${b.value}`}
                  onClick={() => setBg(b)}
                  className={cn(
                    'h-12 rounded-lg ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-ring/40',
                    bg.value === b.value && 'ring-primary',
                  )}
                  style={
                    b.type === 'gradient'
                      ? { backgroundImage: b.value }
                      : { backgroundColor: b.value }
                  }
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || createBoard.isPending}>
              {createBoard.isPending ? 'Creating…' : 'Create board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
