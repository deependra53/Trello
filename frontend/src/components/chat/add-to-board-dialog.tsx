'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, LayoutList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api';
import { useWritableBoards, useBoardLists } from '@/hooks/use-boards';
import { useAddMessageToCard } from '@/hooks/use-cards';
import { isImage, toPlainText } from '@/lib/chat-utils';
import type { Board, ChatMessage } from '@/types/api';

function swatchStyle(background?: Board['background']): React.CSSProperties {
  if (!background) return { backgroundColor: 'hsl(var(--muted))' };
  if (background.type === 'image')
    return { backgroundImage: `url(${background.value})`, backgroundSize: 'cover' };
  if (background.type === 'gradient') return { backgroundImage: background.value };
  return { backgroundColor: background.value };
}

const selectClass =
  'h-10 w-full appearance-none rounded-lg border border-border/60 bg-background pl-10 pr-9 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60';

export function AddToBoardDialog({
  message,
  workspaceId,
  open,
  onOpenChange,
}: {
  message: ChatMessage;
  workspaceId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { data: boards, isLoading: boardsLoading } = useWritableBoards(workspaceId, open);

  const [boardId, setBoardId] = useState('');
  const [listId, setListId] = useState('');
  const { data: lists, isLoading: listsLoading } = useBoardLists(boardId || undefined, open);

  // Defaults derived from the message: title = its first line, description = the body.
  const defaultTitle = useMemo(() => {
    const plain = toPlainText(message.body ?? '');
    const firstLine = plain.split('\n').map((s) => s.trim()).find(Boolean) ?? '';
    return firstLine.slice(0, 120);
  }, [message.body]);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(message.body ?? '');
  const [openAfter, setOpenAfter] = useState(false);

  const add = useAddMessageToCard();

  // Default the board to the first one the user can write to.
  useEffect(() => {
    if (open && !boardId && boards && boards.length) setBoardId(boards[0]!._id);
  }, [open, boardId, boards]);

  // Default the list to the board's first list (and keep it valid when the board changes).
  useEffect(() => {
    if (!lists) return;
    if (!lists.some((l) => l._id === listId)) setListId(lists[0]?._id ?? '');
  }, [lists, listId]);

  const board = boards?.find((b) => b._id === boardId) ?? null;
  const imageCount = (message.attachments ?? []).filter((a) => isImage(a.mimeType)).length;
  const fileCount = (message.attachments ?? []).length - imageCount;

  function reset() {
    setBoardId('');
    setListId('');
    setTitle(defaultTitle);
    setDescription(message.body ?? '');
    setOpenAfter(false);
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 150); // after the close animation
  }

  async function submit() {
    if (!boardId || !listId || !title.trim()) return;
    try {
      const card = await add.mutateAsync({
        listId,
        messageId: message._id,
        title: title.trim(),
        description,
      });
      const listName = lists?.find((l) => l._id === listId)?.title ?? 'list';
      toast.success(`Added to "${board?.title ?? 'board'}"`, { description: `In ${listName}` });
      onOpenChange(false);
      setTimeout(reset, 150);
      if (openAfter) router.push(`/boards/${card.boardId}?card=${card._id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not add to board');
    }
  }

  const noBoards = !boardsLoading && boards && boards.length === 0;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add message as task</DialogTitle>
          <DialogDescription>
            Add title, description (from the message) and confirm.
          </DialogDescription>
        </DialogHeader>

        {noBoards ? (
          <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
            You don&apos;t have any boards you can add cards to.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Board */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Board
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded border border-border/60"
                  style={swatchStyle(board?.background)}
                />
                <select
                  value={boardId}
                  onChange={(e) => {
                    setBoardId(e.target.value);
                    setListId('');
                  }}
                  disabled={boardsLoading}
                  className={selectClass}
                >
                  {boardsLoading && <option>Loading…</option>}
                  {boards?.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.title}
                    </option>
                  ))}
                </select>
                <Chevron />
              </div>
            </div>

            {/* List */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                List
              </label>
              <div className="relative">
                <LayoutList className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  disabled={!boardId || listsLoading}
                  className={selectClass}
                >
                  {listsLoading && <option>Loading…</option>}
                  {!listsLoading && (lists ?? []).length === 0 && <option value="">No lists</option>}
                  {lists?.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.title}
                    </option>
                  ))}
                </select>
                <Chevron />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title <span className="normal-case text-muted-foreground/70">(editable)</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Card title"
                maxLength={500}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={20000}
                placeholder="Description"
                className="w-full resize-none rounded-lg border border-border/60 bg-background p-2.5 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-ring/20 scrollbar-thin"
              />
              {(imageCount > 0 || fileCount > 0) && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  {imageCount > 0 && `${imageCount} image${imageCount > 1 ? 's' : ''}`}
                  {imageCount > 0 && fileCount > 0 && ' · '}
                  {fileCount > 0 && `${fileCount} file${fileCount > 1 ? 's' : ''}`} from the message
                  will be attached
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer: checkbox on the left, actions on the right */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <label
            className={cn(
              'flex cursor-pointer items-center gap-2 text-sm text-foreground/90 select-none',
              noBoards && 'pointer-events-none opacity-50',
            )}
          >
            <input
              type="checkbox"
              checked={openAfter}
              onChange={(e) => setOpenAfter(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Open task after adding
          </label>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={noBoards || !listId || !title.trim() || add.isPending}>
              {add.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Adding…
                </>
              ) : (
                'Add Task'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The down-chevron decoration on the right of a native select. */
function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
