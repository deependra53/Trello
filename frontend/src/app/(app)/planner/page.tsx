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
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <main className="container max-w-7xl py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your scheduled and due cards across the week.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-soft">
          <Button variant="ghost" size="icon" onClick={() => setCursor(subWeeks(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            This week
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addWeeks(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs text-muted-foreground">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
            <div />
            {days.map((d) => (
              <div
                key={d.toISOString()}
                className={cn(
                  'border-l p-2 text-center',
                  isToday(d) && 'text-primary font-bold',
                )}
              >
                <div>{format(d, 'EEE')}</div>
                <div className="text-lg">{format(d, 'd')}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="border-b border-r py-3 pr-2 text-right text-[10px] text-muted-foreground">
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
                        'min-h-[56px] border-b border-l p-1 transition-colors hover:bg-accent/30',
                        isSameDay(d, new Date()) && 'bg-primary/[0.03]',
                      )}
                    >
                      {slotCards.map((c) => (
                        <div
                          key={c._id}
                          className="mb-1 truncate rounded-md bg-primary/15 px-2 py-1 text-[11px] font-medium text-primary"
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

        <aside className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unscheduled this week
          </div>
          {unscheduled.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing here. Cards with neither a due date nor a scheduled time show up here.
            </p>
          ) : (
            unscheduled.map((c) => (
              <div
                key={c._id}
                className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs"
                draggable
              >
                {c.title}
              </div>
            ))
          )}
          <p className="text-[10px] text-muted-foreground">
            Drag-to-schedule and Google Calendar sync arrive in a later phase.
          </p>
        </aside>
      </div>
    </main>
  );
}
