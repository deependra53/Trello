'use client';
import { useState } from 'react';
import { CheckCircle2, CheckSquare, Circle, Clock, MessageCircle, Paperclip } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Card, Label } from '@/types/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUpdateCard } from '@/hooks/use-cards';
import { useUIStore } from '@/stores/ui';
import { useActivityStore } from '@/stores/activity';

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
  if (dueComplete) return 'bg-success/15 text-success';
  if (d < now) return 'bg-destructive/15 text-destructive';
  if (d.getTime() - now.getTime() < 24 * 3600 * 1000) return 'bg-warning/15 text-warning';
  return 'bg-muted text-muted-foreground';
}

export function CardTile({ card, labels, onOpen, isDragging }: Props) {
  const updateCard = useUpdateCard(card.boardId);
  const labelsExpanded = useUIStore((s) => s.labelsExpanded);
  const toggleLabelsExpanded = useUIStore((s) => s.toggleLabelsExpanded);
  const flashing = useActivityStore((s) => !!s.flashing[card._id]);
  const [bouncing, setBouncing] = useState(false);
  const cardLabels = labels?.filter((l) => card.labels?.includes(l._id)) ?? [];
  const checklistTotal = (card.checklists ?? []).reduce((a, c) => a + (c.items?.length ?? 0), 0);
  const checklistDone = (card.checklists ?? []).reduce(
    (a, c) => a + (c.items?.filter((i) => i.completed).length ?? 0),
    0,
  );
  const dueCls = dueColor(card.dueDate, card.dueComplete);

  function toggleComplete(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    setBouncing(true);
    updateCard.mutate({ cardId: card._id, patch: { dueComplete: !card.dueComplete } });
  }

  const coverColor =
    card.cover?.type === 'color' ? card.cover.value : undefined;
  const coverGradient =
    card.cover?.type === 'gradient' ? card.cover.value : undefined;
  const coverImage =
    card.cover?.type === 'image' || card.cover?.type === 'attachment'
      ? card.cover.value
      : undefined;

  return (
    // role=button (not a real <button>) — a <button> inside a Draggable wrapper
    // swallows the mousedown the DnD sensor needs to detect drag-vs-click.
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.();
        }
      }}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border border-border/60 bg-card text-left shadow-xs transition-all duration-200 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0',
        isDragging && 'rotate-2 border-primary/60 shadow-glow ring-2 ring-primary/60',
        // Transient highlight when realtime activity (e.g. a new comment) lands
        // on this card while it isn't open — rolls back via `transition-all`.
        flashing && !isDragging && 'border-primary/70 bg-primary/5 shadow-glow ring-2 ring-primary/70',
      )}
    >
      {coverColor && <div className="h-8" style={{ backgroundColor: coverColor }} />}
      {coverGradient && <div className="h-8" style={{ backgroundImage: coverGradient }} />}
      {coverImage && <img src={coverImage} alt="" className="h-24 w-full object-cover" />}
      <div className="space-y-2 p-3">
        {cardLabels.length > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              toggleLabelsExpanded();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                toggleLabelsExpanded();
              }
            }}
            aria-label={labelsExpanded ? 'Collapse labels' : 'Expand labels'}
            title={labelsExpanded ? 'Collapse labels' : 'Expand labels'}
            className="-mx-0.5 flex flex-wrap gap-1 rounded px-0.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {cardLabels.map((l) =>
              labelsExpanded ? (
                <span
                  key={l._id}
                  className="inline-flex h-5 max-w-[12rem] items-center truncate rounded px-2 text-[11px] font-semibold leading-none text-white shadow-sm"
                  style={{ backgroundColor: l.color }}
                  title={l.name}
                >
                  {l.name || ' '}
                </span>
              ) : (
                <span
                  key={l._id}
                  className="h-2 w-8 rounded-full"
                  style={{ backgroundColor: l.color }}
                  title={l.name}
                />
              ),
            )}
          </div>
        )}
        <div className="relative pl-[1.625rem] text-sm font-medium leading-snug">
          <button
            type="button"
            onClick={toggleComplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') toggleComplete(e);
            }}
            aria-label={card.dueComplete ? 'Mark incomplete' : 'Mark complete'}
            title={card.dueComplete ? 'Mark incomplete' : 'Mark complete'}
            className={cn(
              'absolute left-0 top-0 grid h-5 w-5 place-items-center rounded-full transition-opacity duration-200 ease-out',
              card.dueComplete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            <span
              className={cn('inline-flex', bouncing && 'animate-check-pop')}
              onAnimationEnd={() => setBouncing(false)}
            >
              {card.dueComplete ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" strokeWidth={2} />
              )}
            </span>
          </button>
          <span
            className={cn(
              'block transition-transform duration-200 ease-out [overflow-wrap:anywhere]',
              card.dueComplete
                ? 'translate-x-0'
                : '-translate-x-[1.625rem] group-hover:translate-x-0',
            )}
          >
            {card.title}
          </span>
        </div>
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
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium',
                  dueCls,
                )}
              >
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
    </div>
  );
}
