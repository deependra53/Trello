'use client';
import { CheckSquare, Clock, MessageCircle, Paperclip } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Card, Label } from '@/types/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Props {
  card: Card;
  labels?: Label[];
  onOpen?: () => void;
  isDragging?: boolean;
}

function dueColor(dueDate?: string, dueComplete?: boolean) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const now = new Date();
  if (dueComplete) return 'bg-green-100 text-green-800';
  if (d < now) return 'bg-red-100 text-red-800';
  if (d.getTime() - now.getTime() < 24 * 3600 * 1000) return 'bg-yellow-100 text-yellow-800';
  return 'bg-muted text-muted-foreground';
}

export function CardTile({ card, labels, onOpen, isDragging }: Props) {
  const cardLabels = labels?.filter((l) => card.labels?.includes(l._id)) ?? [];
  const checklistTotal = (card.checklists ?? []).reduce((a, c) => a + (c.items?.length ?? 0), 0);
  const checklistDone = (card.checklists ?? []).reduce(
    (a, c) => a + (c.items?.filter((i) => i.completed).length ?? 0),
    0,
  );
  const dueCls = dueColor(card.dueDate, card.dueComplete);

  const coverColor =
    card.cover?.type === 'color' ? card.cover.value : undefined;
  const coverImage =
    card.cover?.type === 'image' || card.cover?.type === 'attachment'
      ? card.cover.value
      : undefined;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'w-full overflow-hidden rounded-lg bg-card text-left shadow-soft transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary',
        isDragging && 'rotate-2 ring-2 ring-primary/60 shadow-glow',
      )}
    >
      {coverColor && <div className="h-8" style={{ backgroundColor: coverColor }} />}
      {coverImage && <img src={coverImage} alt="" className="h-24 w-full object-cover" />}
      <div className="space-y-2 p-3">
        {cardLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cardLabels.map((l) => (
              <span
                key={l._id}
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: l.color }}
                title={l.name}
              />
            ))}
          </div>
        )}
        <p className="text-sm font-medium leading-snug">{card.title}</p>
        {(card.description ||
          card.dueDate ||
          (card.members && card.members.length > 0) ||
          checklistTotal > 0 ||
          (card.attachments && card.attachments.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {card.description && (
              <span title="Has description" className="leading-none">
                ≡
              </span>
            )}
            {card.dueDate && (
              <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5', dueCls)}>
                <Clock className="h-3 w-3" />
                {formatDistanceToNowStrict(new Date(card.dueDate), { addSuffix: true })}
              </span>
            )}
            {checklistTotal > 0 && (
              <span className="inline-flex items-center gap-1">
                <CheckSquare className="h-3 w-3" /> {checklistDone}/{checklistTotal}
              </span>
            )}
            {card.attachments && card.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3 w-3" /> {card.attachments.length}
              </span>
            )}
            {/* placeholder for comments — server doesn't denormalize count */}
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
            </span>
            <div className="ml-auto flex -space-x-1">
              {(card.members ?? []).slice(0, 3).map((m) => (
                <Avatar key={m} className="h-5 w-5 border-2 border-card">
                  <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                    {m.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
