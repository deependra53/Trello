'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Tag,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  useAddAttachment,
  useAddChecklist,
  useAddChecklistItem,
  useAddComment,
  useArchiveCard,
  useCardActivity,
  useCardComments,
  useConvertChecklistItem,
  useCreateLabel,
  useDeleteAttachment,
  useDeleteChecklist,
  useDeleteChecklistItem,
  useDeleteComment,
  useToggleCardLabel,
  useToggleCardMember,
  useUpdateCard,
  useUpdateChecklist,
  useUpdateChecklistItem,
  useUpdateComment,
  useWatchCard,
  type CardActivity,
} from '@/hooks/use-cards';
import { useAuthStore } from '@/stores/auth';
import { cn, getInitials } from '@/lib/utils';
import type {
  BoardFull,
  BoardMemberProfile,
  Card,
  Checklist as ChecklistT,
  ChecklistItem as ChecklistItemT,
  Comment,
  Label as LabelT,
} from '@/types/api';

interface Props {
  card: Card;
  board: BoardFull;
  open: boolean;
  onClose: () => void;
}

export function CardModal({ card, board, open, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const updateCard = useUpdateCard(board._id);
  const archiveCard = useArchiveCard(board._id);
  const watchCard = useWatchCard(board._id);
  const { data: comments } = useCardComments(open ? card._id : undefined);
  const { data: activity } = useCardActivity(open ? card._id : undefined);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? '');
  }, [card._id, card.title, card.description]);

  const list = board.lists.find((l) => l._id === card.listId);
  const isWatching = card.watchers?.includes(user?._id ?? '') ?? false;

  function saveTitle() {
    if (title.trim() && title !== card.title) {
      updateCard.mutate({ cardId: card._id, patch: { title: title.trim() } });
    }
  }

  function saveDescription() {
    if (description !== (card.description ?? '')) {
      updateCard.mutate({ cardId: card._id, patch: { description } });
    }
    setEditingDesc(false);
  }

  function toggleComplete() {
    setBouncing(true);
    updateCard.mutate({ cardId: card._id, patch: { dueComplete: !card.dueComplete } });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0 scrollbar-thin sm:rounded-xl">
        {card.cover?.type === 'color' && (
          <div className="h-20" style={{ backgroundColor: card.cover.value }} />
        )}
        {card.cover?.type === 'gradient' && (
          <div className="h-20" style={{ backgroundImage: card.cover.value }} />
        )}
        {card.cover && (card.cover.type === 'image' || card.cover.type === 'attachment') && (
          <a
            href={card.cover.value}
            target="_blank"
            rel="noreferrer"
            className="block"
            title="View original image"
          >
            <img
              src={card.cover.value}
              alt=""
              className={cn(
                'w-full object-cover transition hover:opacity-95',
                card.cover.size === 'full' ? 'h-64' : 'h-40',
              )}
            />
          </a>
        )}

        <div className="flex items-center gap-1 px-4 pt-4 pr-12 sm:px-6 sm:pr-14">
          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
            {list?.title ?? '—'}
          </span>
          <div className="ml-auto flex items-center gap-1 text-muted-foreground">
            <CoverPopover boardId={board._id} card={card} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={isWatching ? 'Unwatch' : 'Watch'}
              onClick={() => watchCard.mutate(card._id)}
            >
              {isWatching ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 px-4 pb-6 pt-4 sm:px-6 md:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleComplete}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                title={card.dueComplete ? 'Mark incomplete' : 'Mark complete'}
              >
                <span
                  className={cn('inline-block', bouncing && 'animate-check-pop')}
                  onAnimationEnd={() => setBouncing(false)}
                >
                  {card.dueComplete ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </span>
              </button>
              <DialogTitle asChild>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  className="w-full bg-transparent text-2xl font-bold leading-tight outline-none focus:border-b focus:border-primary"
                />
              </DialogTitle>
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-9 text-xs">
              <LabelsPopover boardId={board._id} card={card} labels={board.labels} />
              <DatesPopover boardId={board._id} card={card} />
              <ChecklistPopover boardId={board._id} card={card} />
              <MembersPopover
                boardId={board._id}
                card={card}
                members={board.memberProfiles ?? []}
              />
            </div>

            <CardChips card={card} board={board} />

            <section>
              <h3 className="mb-2 text-sm font-semibold">Description</h3>
              {editingDesc ? (
                <div className="space-y-2">
                  <Textarea
                    autoFocus
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDescription(card.description ?? '');
                        setEditingDesc(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingDesc(true)}
                  className="block w-full whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-left text-sm hover:bg-muted"
                >
                  {description || (
                    <span className="text-muted-foreground">Add a more detailed description…</span>
                  )}
                </button>
              )}
            </section>

            {(card.checklists ?? []).map((cl) => (
              <ChecklistSection
                key={cl.id}
                boardId={board._id}
                card={card}
                checklist={cl}
                members={board.memberProfiles ?? []}
              />
            ))}

            <AttachmentsSection boardId={board._id} card={card} />
          </div>

          <aside className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Comments and activity</h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </Button>
            </div>
            <CommentComposer cardId={card._id} userName={user?.fullName} />
            <CommentList
              comments={comments ?? []}
              cardId={card._id}
              currentUserId={user?._id}
              memberProfiles={board.memberProfiles ?? []}
              showActivity={showDetails}
              activity={activity ?? []}
            />
            <div className="pt-4">
              <button
                onClick={() => {
                  archiveCard.mutate(card._id);
                  onClose();
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Archive card
              </button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Action button shell ---------------- */

function ActionBtn({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Plus;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-input bg-card hover:bg-accent',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/* ---------------- Cover popover ---------------- */

const COVER_COLORS = [
  '#61BD4F',
  '#F2D600',
  '#FF9F1A',
  '#EB5A46',
  '#C377E0',
  '#0079BF',
  '#00C2E0',
  '#51E898',
  '#FF78CB',
  '#344563',
];

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#795DFF,#9B7BFF)',
  'linear-gradient(135deg,#FF6B6B,#FFA8A8)',
  'linear-gradient(135deg,#5E60CE,#48BFE3)',
  'linear-gradient(135deg,#11998E,#38EF7D)',
  'linear-gradient(135deg,#F2994A,#F2C94C)',
  'linear-gradient(135deg,#FFD166,#F2994A)',
  'linear-gradient(135deg,#EE0979,#FF6A00)',
  'linear-gradient(135deg,#373B44,#4286F4)',
  'linear-gradient(135deg,#0F2027,#2C5364)',
  'linear-gradient(135deg,#FF512F,#DD2476)',
];

function CoverPopover({ boardId, card }: { boardId: string; card: Card }) {
  const update = useUpdateCard(boardId);
  const [url, setUrl] = useState('');
  const cover = card.cover;

  function setColor(value: string) {
    update.mutate({
      cardId: card._id,
      patch: { cover: { type: 'color', value, size: 'normal' } },
    });
  }
  function setGradient(value: string) {
    update.mutate({
      cardId: card._id,
      patch: { cover: { type: 'gradient', value, size: 'normal' } },
    });
  }
  function setImage() {
    const v = url.trim();
    if (!v) return;
    update.mutate({
      cardId: card._id,
      patch: { cover: { type: 'image', value: v, size: cover?.size ?? 'normal' } },
    });
    setUrl('');
  }
  function setSize(size: 'normal' | 'full') {
    if (!cover) return;
    update.mutate({
      cardId: card._id,
      patch: { cover: { ...cover, size } },
    });
  }
  function clear() {
    update.mutate({ cardId: card._id, patch: { cover: null } });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 hover:text-foreground',
            cover ? 'text-primary' : 'text-muted-foreground',
          )}
          title="Cover"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-2 text-center text-sm font-semibold">Cover</div>

        <div className="mb-3 text-xs font-medium text-muted-foreground">Colors</div>
        <div className="grid grid-cols-5 gap-2">
          {COVER_COLORS.map((c) => {
            const on = cover?.type === 'color' && cover.value === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'h-9 rounded-md transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring',
                  on && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                )}
                style={{ backgroundColor: c }}
                aria-label={`Cover color ${c}`}
              />
            );
          })}
        </div>

        <div className="mt-4 mb-2 text-xs font-medium text-muted-foreground">Gradients</div>
        <div className="grid grid-cols-5 gap-2">
          {COVER_GRADIENTS.map((g) => {
            const on = cover?.type === 'gradient' && cover.value === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGradient(g)}
                className={cn(
                  'h-9 rounded-md transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring',
                  on && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                )}
                style={{ backgroundImage: g }}
                aria-label="Cover gradient"
              />
            );
          })}
        </div>

        <div className="mt-4 mb-2 text-xs font-medium text-muted-foreground">Image URL</div>
        <div className="flex gap-2">
          <Input
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setImage()}
          />
          <Button size="sm" onClick={setImage} disabled={!url.trim()}>
            Set
          </Button>
        </div>

        {(cover?.type === 'image' || cover?.type === 'attachment') && (
          <>
            <div className="mt-4 mb-2 text-xs font-medium text-muted-foreground">Size</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={cover.size === 'full' ? 'ghost' : 'default'}
                onClick={() => setSize('normal')}
                className="flex-1"
              >
                Normal
              </Button>
              <Button
                size="sm"
                variant={cover.size === 'full' ? 'default' : 'ghost'}
                onClick={() => setSize('full')}
                className="flex-1"
              >
                Full
              </Button>
            </div>
          </>
        )}

        {cover && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="mt-3 w-full text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Remove cover
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- Labels popover ---------------- */

const LABEL_COLORS = [
  '#61BD4F',
  '#F2D600',
  '#FF9F1A',
  '#EB5A46',
  '#C377E0',
  '#0079BF',
  '#00C2E0',
  '#51E898',
  '#FF78CB',
  '#344563',
];

function LabelsPopover({
  boardId,
  card,
  labels,
}: {
  boardId: string;
  card: Card;
  labels: LabelT[];
}) {
  const toggle = useToggleCardLabel(boardId);
  const createLabel = useCreateLabel(boardId);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(LABEL_COLORS[0]);
  const selected = new Set(card.labels ?? []);

  function resetCreate() {
    setCreating(false);
    setNewName('');
    setNewColor(LABEL_COLORS[0]);
  }

  function submitCreate() {
    if (!newColor) return;
    createLabel.mutate(
      { name: newName.trim(), color: newColor },
      { onSuccess: () => resetCreate() },
    );
  }

  return (
    <Popover onOpenChange={(o) => !o && resetCreate()}>
      <PopoverTrigger asChild>
        <button type="button">
          <ActionBtn icon={Tag} label="Labels" active={selected.size > 0} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-2 text-center text-sm font-semibold">Labels</div>
        <div className="space-y-1.5">
          {labels.length === 0 && !creating && (
            <p className="px-1 py-2 text-center text-xs text-muted-foreground">
              No labels on this board yet.
            </p>
          )}
          {labels.map((l) => {
            const on = selected.has(l._id);
            return (
              <button
                key={l._id}
                type="button"
                onClick={() => toggle.mutate({ cardId: card._id, labelId: l._id })}
                className="flex w-full items-center gap-2 rounded-md p-1 text-left text-sm hover:bg-accent"
              >
                <span
                  className="h-7 flex-1 rounded-md px-2 leading-7 text-xs font-medium text-white"
                  style={{ backgroundColor: l.color }}
                >
                  {l.name || ' '}
                </span>
                {on && <CheckSquare className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="mt-3 border-t pt-3">
          {creating ? (
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Title
                </label>
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
                  placeholder="Label name"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {LABEL_COLORS.map((c) => {
                    const on = newColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={cn(
                          'h-7 rounded-md transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring',
                          on && 'ring-2 ring-ring ring-offset-2 ring-offset-popover',
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Label color ${c}`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={submitCreate}
                  disabled={createLabel.isPending}
                >
                  {createLabel.isPending ? 'Creating…' : 'Create'}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetCreate}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setCreating(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create a new label
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- Members popover ---------------- */

function MembersPopover({
  boardId,
  card,
  members,
}: {
  boardId: string;
  card: Card;
  members: BoardMemberProfile[];
}) {
  const toggle = useToggleCardMember(boardId);
  const [q, setQ] = useState('');
  const selected = new Set(card.members ?? []);
  const filtered = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(q.toLowerCase()) ||
      m.email.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button">
          <ActionBtn icon={UserIcon} label="Members" active={selected.size > 0} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-2 text-center text-sm font-semibold">Members</div>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="mb-1 text-xs font-semibold text-muted-foreground">Board members</div>
        <div className="space-y-1">
          {filtered.length === 0 && (
            <p className="px-1 py-2 text-xs text-muted-foreground">No matches.</p>
          )}
          {filtered.map((m) => {
            const on = selected.has(m._id);
            return (
              <button
                key={m._id}
                type="button"
                onClick={() => toggle.mutate({ cardId: card._id, userId: m._id })}
                className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-sm hover:bg-accent"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                    {getInitials(m.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{m.fullName}</span>
                {on && <CheckSquare className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- Dates popover ---------------- */

function toDateInputValue(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DatesPopover({ boardId, card }: { boardId: string; card: Card }) {
  const update = useUpdateCard(boardId);
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(toDateInputValue(card.startDate));
  const [due, setDue] = useState(toDateInputValue(card.dueDate));

  useEffect(() => {
    setStart(toDateInputValue(card.startDate));
    setDue(toDateInputValue(card.dueDate));
  }, [card.startDate, card.dueDate]);

  function save() {
    update.mutate({
      cardId: card._id,
      patch: {
        startDate: start ? new Date(start).toISOString() : null,
        dueDate: due ? new Date(due).toISOString() : null,
      },
    });
    setOpen(false);
  }

  function clearDates() {
    setStart('');
    setDue('');
    update.mutate({ cardId: card._id, patch: { startDate: null, dueDate: null } });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <ActionBtn icon={CalendarIcon} label="Dates" active={!!(card.startDate || card.dueDate)} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="mb-2 text-center text-sm font-semibold">Dates</div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Start date
            </label>
            <Input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Due date
            </label>
            <Input
              type="datetime-local"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" onClick={save}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={clearDates}>
              Remove
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- Checklist popover ---------------- */

function ChecklistPopover({ boardId, card }: { boardId: string; card: Card }) {
  const add = useAddChecklist(boardId);
  const [title, setTitle] = useState('Checklist');
  const [open, setOpen] = useState(false);

  function submit() {
    if (!title.trim()) return;
    add.mutate(
      { cardId: card._id, title: title.trim() },
      {
        onSuccess: () => {
          setTitle('Checklist');
          setOpen(false);
        },
      },
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <ActionBtn
            icon={CheckSquare}
            label="Checklist"
            active={(card.checklists ?? []).length > 0}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-2 text-center text-sm font-semibold">Add checklist</div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Title
        </label>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="mb-3 h-9 text-sm"
        />
        <Button size="sm" className="w-full" onClick={submit} disabled={add.isPending}>
          Add
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- Card chips (members/labels/due preview) ---------------- */

function CardChips({ card, board }: { card: Card; board: BoardFull }) {
  const profiles = board.memberProfiles ?? [];
  const assigned = profiles.filter((m) => card.members?.includes(m._id));
  const cardLabels = board.labels.filter((l) => card.labels?.includes(l._id));

  if (assigned.length === 0 && cardLabels.length === 0 && !card.dueDate && !card.startDate)
    return null;

  return (
    <div className="flex flex-wrap items-end gap-4 pl-9 text-xs">
      {assigned.length > 0 && (
        <div>
          <div className="mb-1 font-semibold text-muted-foreground">Members</div>
          <div className="flex -space-x-1">
            {assigned.slice(0, 6).map((m) => (
              <Avatar key={m._id} className="h-7 w-7 border-2 border-background" title={m.fullName}>
                <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                  {getInitials(m.fullName)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}
      {cardLabels.length > 0 && (
        <div>
          <div className="mb-1 font-semibold text-muted-foreground">Labels</div>
          <div className="flex flex-wrap gap-1">
            {cardLabels.map((l) => (
              <span
                key={l._id}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name || ' '}
              </span>
            ))}
          </div>
        </div>
      )}
      {card.dueDate && (
        <div>
          <div className="mb-1 font-semibold text-muted-foreground">Due date</div>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
            <CalendarIcon className="h-3 w-3" />
            {format(new Date(card.dueDate), 'PP p')}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Checklist section ---------------- */

function ChecklistSection({
  boardId,
  card,
  checklist,
  members,
}: {
  boardId: string;
  card: Card;
  checklist: ChecklistT;
  members: BoardMemberProfile[];
}) {
  const remove = useDeleteChecklist(boardId);
  const rename = useUpdateChecklist(boardId);
  const addItem = useAddChecklistItem(boardId);
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(checklist.title);

  const items = useMemo(
    () => [...(checklist.items ?? [])].sort((a, b) => a.position - b.position),
    [checklist.items],
  );
  const done = items.filter((i) => i.completed).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  function submitItem() {
    if (!newItem.trim()) return;
    addItem.mutate(
      { cardId: card._id, checklistId: checklist.id, text: newItem.trim() },
      {
        onSuccess: () => {
          setNewItem('');
        },
      },
    );
  }

  function saveTitle() {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== checklist.title) {
      rename.mutate({
        cardId: card._id,
        checklistId: checklist.id,
        patch: { title: titleDraft.trim() },
      });
    } else {
      setTitleDraft(checklist.title);
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="flex-1 bg-transparent text-sm font-semibold outline-none focus:border-b focus:border-primary"
          />
        ) : (
          <h3
            className="flex-1 text-sm font-semibold"
            onDoubleClick={() => setEditingTitle(true)}
            title="Double-click to rename"
          >
            {checklist.title}
          </h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => remove.mutate({ cardId: card._id, checklistId: checklist.id })}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="mb-2 flex items-center gap-2 pl-6 text-xs text-muted-foreground">
        <span className="w-8 text-right tabular-nums">{pct}%</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-500 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <ul className="space-y-1 pl-2">
        {items.map((it) => (
          <ChecklistItemRow
            key={it.id}
            boardId={boardId}
            cardId={card._id}
            item={it}
            members={members}
          />
        ))}
      </ul>
      <div className="mt-2 pl-6">
        {adding ? (
          <div className="space-y-2">
            <Textarea
              autoFocus
              rows={2}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add an item"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitItem} disabled={addItem.isPending}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewItem('');
                  setAdding(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add an item
          </Button>
        )}
      </div>
    </section>
  );
}

function ChecklistItemRow({
  boardId,
  cardId,
  item,
  members,
}: {
  boardId: string;
  cardId: string;
  item: ChecklistItemT;
  members: BoardMemberProfile[];
}) {
  const update = useUpdateChecklistItem(boardId);
  const remove = useDeleteChecklistItem(boardId);
  const convert = useConvertChecklistItem(boardId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setDraft(item.text), [item.text]);

  function saveText() {
    setEditing(false);
    if (draft.trim() && draft !== item.text) {
      update.mutate({ cardId, itemId: item.id, patch: { text: draft.trim() } });
    } else {
      setDraft(item.text);
    }
  }

  const assignee = item.memberId ? members.find((m) => m._id === item.memberId) : undefined;
  const due = item.dueDate ? new Date(item.dueDate) : undefined;
  const overdue = due ? due < new Date() && !item.completed : false;

  return (
    <li className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-accent/40">
      <button
        type="button"
        onClick={() =>
          update.mutate({ cardId, itemId: item.id, patch: { completed: !item.completed } })
        }
        className="mt-0.5"
        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {item.completed ? (
          <CheckSquare className="h-4 w-4 text-emerald-500" />
        ) : (
          <span className="block h-4 w-4 rounded border border-muted-foreground/40" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraft(item.text);
                setEditing(false);
              }
            }}
            className="w-full bg-transparent text-sm outline-none focus:border-b focus:border-primary"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={cn(
              'block w-full text-left text-sm',
              item.completed && 'text-muted-foreground line-through',
            )}
          >
            {item.text}
          </button>
        )}
        {(assignee || due) && (
          <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
            {assignee && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5"
                title={assignee.fullName}
              >
                <Avatar className="h-3.5 w-3.5">
                  <AvatarFallback className="bg-primary/10 text-[8px] font-bold text-primary">
                    {getInitials(assignee.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[120px]">{assignee.fullName}</span>
              </span>
            )}
            {due && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
                  overdue ? 'bg-red-100 text-red-800' : 'bg-muted text-muted-foreground',
                )}
              >
                <Clock className="h-3 w-3" />
                {format(due, 'PP')}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <ItemDuePopover boardId={boardId} cardId={cardId} item={item} />
        <ItemAssignPopover
          boardId={boardId}
          cardId={cardId}
          item={item}
          members={members}
        />
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent"
              title="Item actions"
              aria-label="Item actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <div className="px-2 pt-1 pb-2 text-center text-xs font-semibold">Item actions</div>
            <button
              type="button"
              onClick={() => {
                convert.mutate({ cardId, itemId: item.id });
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" /> Convert to card
            </button>
            <button
              type="button"
              onClick={() => {
                remove.mutate({ cardId, itemId: item.id });
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </li>
  );
}

function ItemDuePopover({
  boardId,
  cardId,
  item,
}: {
  boardId: string;
  cardId: string;
  item: ChecklistItemT;
}) {
  const update = useUpdateChecklistItem(boardId);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(toDateInputValue(item.dueDate ?? undefined));

  useEffect(() => setValue(toDateInputValue(item.dueDate ?? undefined)), [item.dueDate]);

  function save() {
    update.mutate({
      cardId,
      itemId: item.id,
      patch: { dueDate: value ? new Date(value).toISOString() : null },
    });
    setOpen(false);
  }
  function clear() {
    setValue('');
    update.mutate({ cardId, itemId: item.id, patch: { dueDate: null } });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'rounded-md p-1 hover:bg-accent',
            item.dueDate ? 'text-primary' : 'text-muted-foreground',
          )}
          title="Due date"
          aria-label="Due date"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-2 text-center text-sm font-semibold">Due date</div>
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 text-sm"
        />
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={save}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={clear}>
            Remove
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ItemAssignPopover({
  boardId,
  cardId,
  item,
  members,
}: {
  boardId: string;
  cardId: string;
  item: ChecklistItemT;
  members: BoardMemberProfile[];
}) {
  const update = useUpdateChecklistItem(boardId);
  const [open, setOpen] = useState(false);

  function assign(memberId: string | null) {
    update.mutate({ cardId, itemId: item.id, patch: { memberId } });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'rounded-md p-1 hover:bg-accent',
            item.memberId ? 'text-primary' : 'text-muted-foreground',
          )}
          title="Assign"
          aria-label="Assign"
        >
          <UserIcon className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="mb-2 text-center text-sm font-semibold">Assign</div>
        {members.length === 0 && (
          <p className="px-1 py-2 text-center text-xs text-muted-foreground">
            No board members yet.
          </p>
        )}
        <div className="space-y-1">
          {members.map((m) => {
            const on = item.memberId === m._id;
            return (
              <button
                key={m._id}
                type="button"
                onClick={() => assign(on ? null : m._id)}
                className="flex w-full items-center gap-2 rounded-md p-1 text-left text-sm hover:bg-accent"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                    {getInitials(m.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{m.fullName}</span>
                {on && <CheckSquare className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AttachmentsSection({ boardId, card }: { boardId: string; card: Card }) {
  const add = useAddAttachment(boardId);
  const remove = useDeleteAttachment(boardId);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachments = card.attachments ?? [];

  function pick() {
    inputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    add.mutate({ cardId: card._id, file });
    e.target.value = '';
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          Attachments
        </h3>
        <Button size="sm" variant="outline" onClick={pick} disabled={add.isPending}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          {add.isPending ? 'Uploading…' : 'Add'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onFile}
        />
      </div>
      {attachments.length === 0 ? (
        <p className="pl-6 text-xs text-muted-foreground">No attachments yet.</p>
      ) : (
        <ul className="space-y-2 pl-2">
          {attachments.map((a) => {
            const isImg = (a.mimeType ?? '').startsWith('image/');
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-md border bg-card p-2 text-sm"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-muted"
                  title="Open attachment"
                >
                  {isImg ? (
                    <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </a>
                <div className="min-w-0 flex-1">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-medium hover:underline"
                  >
                    {a.name}
                  </a>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.size ? `${Math.round(a.size / 1024)} KB` : a.mimeType ?? 'file'}
                  </div>
                </div>
                <a
                  href={a.url}
                  download={a.name}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => remove.mutate({ cardId: card._id, attachmentId: a.id })}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                  title="Delete attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Comments ---------------- */

function CommentComposer({ cardId, userName }: { cardId: string; userName?: string }) {
  const add = useAddComment(cardId);
  const [body, setBody] = useState('');
  const canSubmit = !add.isPending && body.trim().length > 0;

  async function submit() {
    if (!canSubmit) return;
    await add.mutateAsync(body.trim());
    setBody('');
  }

  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <Textarea
          rows={3}
          placeholder="Write a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="resize-none text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={submit}
            disabled={!canSubmit}
            className="transition-[background-color,color,opacity] duration-200 disabled:opacity-60"
          >
            {add.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBody('')}
            disabled={body.length === 0}
            className="transition-[background-color,color,opacity] duration-200 disabled:opacity-60"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentList({
  comments,
  cardId,
  currentUserId,
  memberProfiles,
  showActivity,
  activity,
}: {
  comments: Comment[];
  cardId: string;
  currentUserId?: string;
  memberProfiles: BoardMemberProfile[];
  showActivity: boolean;
  activity: CardActivity[];
}) {
  type Entry =
    | { kind: 'comment'; at: string; data: Comment }
    | { kind: 'activity'; at: string; data: CardActivity };
  const entries: Entry[] = [
    ...comments.map<Entry>((c) => ({ kind: 'comment', at: c.createdAt, data: c })),
    ...(showActivity
      ? activity.map<Entry>((a) => ({ kind: 'activity', at: a.createdAt, data: a }))
      : []),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  if (entries.length === 0)
    return <p className="text-xs text-muted-foreground">No comments yet.</p>;

  return (
    <div className="space-y-3">
      {entries.map((e) =>
        e.kind === 'comment' ? (
          <CommentRow
            key={`c-${e.data._id}`}
            comment={e.data}
            cardId={cardId}
            isOwn={e.data.authorId === currentUserId}
            author={memberProfiles.find((m) => m._id === e.data.authorId)}
          />
        ) : (
          <ActivityRow
            key={`a-${e.data._id}`}
            activity={e.data}
            actor={memberProfiles.find((m) => m._id === e.data.actorId)}
          />
        ),
      )}
    </div>
  );
}

function ActivityRow({
  activity,
  actor,
}: {
  activity: CardActivity;
  actor?: BoardMemberProfile;
}) {
  const actorName = actor?.fullName ?? `User ${activity.actorId.slice(0, 6)}`;
  const message = describeActivity(activity, actorName);
  if (!message) return null;
  return (
    <div className="flex gap-2 text-xs">
      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
        <AvatarFallback className="bg-muted text-[9px] font-bold text-muted-foreground">
          {getInitials(actorName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 text-muted-foreground">
        <span>{message}</span>
        <div className="mt-0.5">
          {formatDistanceToNowStrict(new Date(activity.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

function describeActivity(a: CardActivity, actor: string): string | null {
  const text = (a.payload as { text?: string } | undefined)?.text ?? '';
  switch (a.type) {
    case 'card.created':
      return `${actor} created this card`;
    case 'card.updated':
      return `${actor} updated this card`;
    case 'card.checklist.added':
      return `${actor} added a checklist`;
    case 'card.checklist.item.added':
      return `${actor} added "${text}"`;
    case 'card.checklist.item.completed':
      return `${actor} marked "${text}" complete`;
    case 'card.checklist.item.uncompleted':
      return `${actor} marked "${text}" incomplete`;
    case 'card.checklist.item.assigned':
      return `${actor} assigned "${text}"`;
    case 'card.checklist.item.unassigned':
      return `${actor} unassigned "${text}"`;
    case 'card.checklist.item.due-set':
      return `${actor} set a due date on "${text}"`;
    case 'card.checklist.item.due-cleared':
      return `${actor} cleared the due date on "${text}"`;
    case 'card.checklist.item.deleted':
      return `${actor} deleted "${text}"`;
    case 'card.checklist.item.converted':
      return `${actor} converted "${text}" into a new card`;
    case 'card.copied':
      return `${actor} copied this card`;
    case 'card.commented':
      return null; // shown as comment
    default:
      return `${actor} · ${a.type}`;
  }
}

function CommentRow({
  comment,
  cardId,
  isOwn,
  author,
}: {
  comment: Comment;
  cardId: string;
  isOwn: boolean;
  author?: BoardMemberProfile;
}) {
  const update = useUpdateComment(cardId);
  const remove = useDeleteComment(cardId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  function saveEdit() {
    if (!draft.trim() || draft === comment.body) {
      setEditing(false);
      setDraft(comment.body);
      return;
    }
    update.mutate(
      { commentId: comment._id, body: draft.trim() },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
          {getInitials(author?.fullName ?? comment.authorId)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-xs">
          <span className="font-semibold text-foreground">
            {author?.fullName ?? `User ${comment.authorId.slice(0, 6)}`}
          </span>{' '}
          <span className="text-muted-foreground">
            {formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })}
            {comment.editedAt && ' (edited)'}
          </span>
        </div>
        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={update.isPending}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-sm [overflow-wrap:anywhere]">
              {comment.body}
            </div>
            {isOwn && (
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <button onClick={() => setEditing(true)} className="hover:underline">
                  Edit
                </button>
                <span>·</span>
                <button
                  onClick={() => remove.mutate(comment._id)}
                  className="hover:text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
