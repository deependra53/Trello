'use client';
import { useMemo, useState } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  isWeekend,
  startOfMonth,
  subMonths,
  addMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BoardFull, Card, Label, List } from '@/types/api';

interface Props {
  board: BoardFull;
  onOpenCard: (cardId: string) => void;
}

const DAY_WIDTH = 36;

export function TimelineView({ board, onOpenCard }: Props) {
  const [cursor, setCursor] = useState(new Date());
  const rangeStart = startOfMonth(cursor);
  const rangeEnd = endOfMonth(cursor);
  const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < totalDays; i++) arr.push(addDays(rangeStart, i));
    return arr;
  }, [rangeStart, totalDays]);

  const labelMap = useMemo(
    () => new Map<string, Label>(board.labels.map((l) => [l._id, l])),
    [board.labels],
  );
  const listMap = useMemo(
    () => new Map<string, List>(board.lists.map((l) => [l._id, l])),
    [board.lists],
  );

  // Cards that have either a startDate or dueDate within range
  const cardsInRange = useMemo(() => {
    return (board.cards ?? []).filter((c) => {
      if (c.archived) return false;
      if (!c.startDate && !c.dueDate) return false;
      const s = c.startDate ? new Date(c.startDate) : null;
      const e = c.dueDate ? new Date(c.dueDate) : null;
      const candidateStart = s ?? e!;
      const candidateEnd = e ?? s!;
      return candidateEnd >= rangeStart && candidateStart <= rangeEnd;
    });
  }, [board.cards, rangeStart, rangeEnd]);

  // Group by list
  const grouped = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of cardsInRange) {
      if (!map.has(c.listId)) map.set(c.listId, []);
      map.get(c.listId)!.push(c);
    }
    return Array.from(map.entries());
  }, [cardsInRange]);

  function barFor(c: Card) {
    const s = c.startDate ? new Date(c.startDate) : new Date(c.dueDate!);
    const e = c.dueDate ? new Date(c.dueDate) : new Date(c.startDate!);
    const offsetDays = Math.max(0, differenceInCalendarDays(s, rangeStart));
    const lengthDays = Math.max(
      1,
      differenceInCalendarDays(e, s < rangeStart ? rangeStart : s) + 1,
    );
    const trimmedLen = Math.min(lengthDays, totalDays - offsetDays);
    return { left: offsetDays * DAY_WIDTH, width: trimmedLen * DAY_WIDTH - 2 };
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-3 shadow-soft">
        <h3 className="text-base font-semibold">{format(cursor, 'MMMM yyyy')}</h3>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
        <div className="flex h-full">
          <div className="w-48 shrink-0 overflow-y-auto border-r border-border/60 bg-muted/30 scrollbar-thin">
            <div className="sticky top-0 z-10 h-9 border-b border-border/60 bg-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
              List
            </div>
            {grouped.map(([listId, cards]) => (
              <div key={listId} className="border-b border-border/60">
                <div className="px-3 py-2 text-xs font-semibold">
                  {listMap.get(listId)?.title ?? 'Unknown'}
                </div>
                {cards.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => onOpenCard(c._id)}
                    className="block w-full truncate px-4 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">
                No cards with start/due dates in this month.
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin">
            <div style={{ width: totalDays * DAY_WIDTH }} className="relative">
              <div className="sticky top-0 z-10 flex h-9 border-b border-border/60 bg-muted/60">
                {days.map((d) => (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      'flex shrink-0 flex-col items-center justify-center border-r border-border/60 text-[10px]',
                      isWeekend(d) && 'bg-muted/80',
                      isToday(d) && 'bg-primary/10 font-bold text-primary',
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span>{format(d, 'EEEEE')}</span>
                    <span>{format(d, 'd')}</span>
                  </div>
                ))}
              </div>

              {grouped.map(([listId, cards]) => (
                <div key={listId} className="border-b border-border/60">
                  <div className="relative h-[33px] border-b border-border/60" />
                  {cards.map((c) => {
                    const { left, width } = barFor(c);
                    const lbl = (c.labels ?? [])[0];
                    const color = lbl ? labelMap.get(lbl)?.color : '#795DFF';
                    return (
                      <div key={c._id} className="relative h-[29px] border-b border-border/60">
                        <button
                          onClick={() => onOpenCard(c._id)}
                          className="absolute top-1.5 grid h-5 place-items-center rounded-md px-2 text-[10px] font-medium text-white shadow-soft transition hover:scale-[1.02]"
                          style={{ left, width, backgroundColor: color ?? '#795DFF' }}
                          title={c.title}
                        >
                          <span className="truncate">{c.title}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Today line */}
              {days.some((d) => isToday(d)) && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary/70"
                  style={{
                    left:
                      DAY_WIDTH *
                        days.findIndex((d) => isSameDay(d, new Date())) +
                      DAY_WIDTH / 2,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
