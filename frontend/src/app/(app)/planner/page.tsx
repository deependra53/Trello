'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
  addWeeks,
} from 'date-fns';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Card } from '@/types/api';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8am → 7pm

export default function PlannerPage() {
  const [cursor, setCursor] = useState(new Date());
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const { data: cards } = useQuery({
    queryKey: ['planner', weekStart.toISOString()],
    queryFn: () =>
      api<{ items: Card[] }>('/api/planner', {
        query: { from: weekStart.toISOString(), to: weekEnd.toISOString() },
      }).then((r) => r.items),
  });

  const cardsByDay = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of cards ?? []) {
      const when = c.scheduledAt ?? c.dueDate;
      if (!when) continue;
      const k = format(new Date(when), 'yyyy-MM-dd');
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return map;
  }, [cards]);

  const unscheduled = useMemo(
    () =>
      (cards ?? []).filter((c) => !c.scheduledAt && !c.dueDate),
    [cards],
  );

  return (
    <main className="container max-w-7xl py-8 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Planner</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your scheduled and due cards across the week.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setCursor(subWeeks(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            This week
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addWeeks(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs font-medium text-muted-foreground">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
          <div className="grid min-w-[700px] grid-cols-[60px_repeat(7,1fr)] border-b border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground lg:min-w-0">
            <div />
            {days.map((d) => (
              <div
                key={d.toISOString()}
                className={cn(
                  'border-l border-border/60 p-2 text-center transition-colors',
                  isToday(d) && 'font-bold text-primary',
                )}
              >
                <div className="uppercase tracking-wider">{format(d, 'EEE')}</div>
                <div
                  className={cn(
                    'mx-auto mt-0.5 grid h-7 w-7 place-items-center rounded-full text-lg font-semibold',
                    isToday(d) && 'bg-primary text-primary-foreground',
                  )}
                >
                  {format(d, 'd')}
                </div>
              </div>
            ))}
          </div>
          <div className="grid min-w-[700px] grid-cols-[60px_repeat(7,1fr)] lg:min-w-0">
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="border-b border-r border-border/60 py-3 pr-2 text-right text-[10px] font-medium text-muted-foreground">
                  {h % 12 || 12}
                  {h < 12 ? 'a' : 'p'}
                </div>
                {days.map((d) => {
                  const dayKey = format(d, 'yyyy-MM-dd');
                  const slotCards = (cardsByDay.get(dayKey) ?? []).filter((c) => {
                    const when = c.scheduledAt ?? c.dueDate;
                    if (!when) return false;
                    return new Date(when).getHours() === h;
                  });
                  return (
                    <div
                      key={`${dayKey}-${h}`}
                      className={cn(
                        'min-h-[56px] border-b border-l border-border/60 p-1 transition-colors hover:bg-muted/50',
                        isSameDay(d, new Date()) && 'bg-primary/[0.04]',
                      )}
                    >
                      {slotCards.map((c) => (
                        <div
                          key={c._id}
                          className="mb-1 truncate rounded-md border border-primary/20 bg-primary/15 px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                          title={c.title}
                        >
                          {c.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unscheduled this week
          </div>
          {unscheduled.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CalendarClock className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Nothing unscheduled</p>
              <p className="text-xs text-muted-foreground">
                Cards with neither a due date nor a scheduled time show up here.
              </p>
            </div>
          ) : (
            unscheduled.map((c) => (
              <div
                key={c._id}
                className="cursor-grab rounded-lg border border-border/60 bg-muted/40 px-2.5 py-2 text-xs font-medium transition-colors hover:bg-muted active:cursor-grabbing"
                draggable
              >
                {c.title}
              </div>
            ))
          )}
          <p className="pt-1 text-[10px] text-muted-foreground">
            Drag-to-schedule and Google Calendar sync arrive in a later phase.
          </p>
        </aside>
      </div>
    </main>
  );
}
