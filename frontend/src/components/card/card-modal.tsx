'use client';
import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  Archive,
  Calendar,
  CheckSquare,
  Eye,
  Paperclip,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  useAddComment,
  useArchiveCard,
  useCardComments,
  useUpdateCard,
} from '@/hooks/use-cards';
import { useAuthStore } from '@/stores/auth';
import { getInitials } from '@/lib/utils';
import type { BoardFull, Card } from '@/types/api';

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
  const { data: comments } = useCardComments(open ? card._id : undefined);
  const addComment = useAddComment(card._id);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? '');
  }, [card._id, card.title, card.description]);

  const list = board.lists.find((l) => l._id === card.listId);

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

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment.mutateAsync(newComment.trim());
    setNewComment('');
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0 sm:rounded-xl">
        {card.cover?.type === 'color' && (
          <div className="h-20" style={{ backgroundColor: card.cover.value }} />
        )}
        {card.cover && (card.cover.type === 'image' || card.cover.type === 'attachment') && (
          <img src={card.cover.value} alt="" className="h-40 w-full object-cover" />
        )}

        <div className="grid gap-6 p-6 md:grid-cols-[1fr_180px]">
          <div className="space-y-5 min-w-0">
            <div>
              <DialogTitle asChild>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  className="w-full bg-transparent text-xl font-bold outline-none focus:border-b focus:border-primary"
                />
              </DialogTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                in list <span className="font-medium">{list?.title}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              {card.dueDate && (
                <div>
                  <div className="mb-1 font-semibold text-muted-foreground">Due date</div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(card.dueDate).toLocaleString()}
                  </span>
                </div>
              )}
              {card.members && card.members.length > 0 && (
                <div>
                  <div className="mb-1 font-semibold text-muted-foreground">Members</div>
                  <div className="flex -space-x-1">
                    {card.members.slice(0, 5).map((m) => (
                      <Avatar key={m} className="h-7 w-7 border-2 border-background">
                        <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                          {m.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              )}
            </div>

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

            <section>
              <h3 className="mb-3 text-sm font-semibold">Activity</h3>
              <form onSubmit={postComment} className="mb-4 flex gap-3">
                <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                    {getInitials(user?.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Write a comment…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  {newComment.trim() && (
                    <Button type="submit" size="sm" disabled={addComment.isPending}>
                      {addComment.isPending ? 'Posting…' : 'Save'}
                    </Button>
                  )}
                </div>
              </form>

              <div className="space-y-4">
                {(comments ?? []).map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                        {c.authorId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {c.authorId.slice(0, 6)}
                        </span>
                        {' · '}
                        {formatDistanceToNowStrict(new Date(c.createdAt), { addSuffix: true })}
                        {c.editedAt && <span> (edited)</span>}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-sm">
                        {c.body}
                      </div>
                    </div>
                  </div>
                ))}
                {comments && comments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4 text-xs">
            <div>
              <h4 className="mb-2 text-muted-foreground font-semibold uppercase tracking-wider">
                Add to card
              </h4>
              <div className="space-y-1.5">
                <SidebarAction icon={User} label="Members" />
                <SidebarAction icon={Tag} label="Labels" />
                <SidebarAction icon={CheckSquare} label="Checklist" />
                <SidebarAction icon={Calendar} label="Dates" />
                <SidebarAction icon={Paperclip} label="Attachment" />
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-muted-foreground font-semibold uppercase tracking-wider">
                Actions
              </h4>
              <div className="space-y-1.5">
                <SidebarAction icon={Eye} label="Watch" />
                <SidebarAction
                  icon={Archive}
                  label="Archive"
                  onClick={() => {
                    archiveCard.mutate(card._id);
                    onClose();
                  }}
                />
                <SidebarAction
                  icon={Trash2}
                  label="Delete"
                  className="text-destructive hover:bg-destructive/10"
                />
                <SidebarAction icon={X} label="Close" onClick={onClose} />
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SidebarAction({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: typeof Calendar;
  label: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex w-full items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-left text-xs font-medium transition hover:bg-accent/60 ' +
        (className ?? '')
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
