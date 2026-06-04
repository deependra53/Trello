'use client';
import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUpdateCard } from '@/hooks/use-cards';
import type { BoardFull, Card, Label } from '@/types/api';

interface Props {
  board: BoardFull;
  onOpenCard: (cardId: string) => void;
}

function dayKey(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export function CalendarView({ board, onOpenCard }: Props) {
  const [cursor, setCursor] = useState(new Date());
  const updateCard = useUpdateCard(board._id);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const arr: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) arr.push(d);
    return arr;
  }, [cursor]);

  const cardsByDay = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of board.cards ?? []) {
      if (c.archived || !c.dueDate) continue;
      const k = dayKey(new Date(c.dueDate));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return map;
  }, [board]);

  const labelMap = useMemo(
    () => new Map<string, Label>(board.labels.map((l) => [l._id, l])),
    [board.labels],
  );

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    if (result.source.droppableId === result.destination.droppableId) return;
    const cardId = result.draggableId;
    const card = board.cards.find((c) => c._id === cardId);
    if (!card) return;
    const newDay = new Date(result.destination.droppableId);
    // Preserve time-of-day from existing dueDate if present
    if (card.dueDate) {
      const old = new Date(card.dueDate);
      newDay.setHours(old.getHours(), old.getMinutes(), 0, 0);
    } else {
      newDay.setHours(17, 0, 0, 0);
    }
    updateCard.mutate({
      cardId,
      patch: { dueDate: newDay.toISOString() },
    });
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4 pb-24 animate-fade-up lg:pb-4">
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
        <h3 className="text-base font-bold tracking-tight">{format(cursor, 'MMMM yyyy')}</h3>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(subMonths(cursor, 1))}
            aria-label="Previous month"
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Next month"
            className="h-8 w-8 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border/60 bg-card shadow-sm scrollbar-thin lg:overflow-hidden">
        <div className="flex h-full min-w-[44rem] flex-col lg:min-w-0">
        <div className="grid grid-cols-7 border-b border-border/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-2 py-2.5 text-center">
              {d}
            </div>
          ))}
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid h-[calc(100%-2.25rem)] grid-cols-7 grid-rows-6 divide-x divide-y divide-border/60">
            {days.map((d) => {
              const k = dayKey(d);
              const cards = cardsByDay.get(k) ?? [];
              const inMonth = isSameMonth(d, cursor);
              return (
                <Droppable key={k} droppableId={k}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'relative flex min-h-0 flex-col gap-1 overflow-y-auto p-1.5 transition-colors scrollbar-thin',
                        !inMonth && 'bg-muted/40 text-muted-foreground',
                        snapshot.isDraggingOver && 'bg-accent/60',
                      )}
                    >
                      <div
                        className={cn(
                          'mb-1 flex items-center justify-between text-xs font-medium',
                          isToday(d) && 'text-primary',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-6 w-6 place-items-center rounded-full',
                            isToday(d) && 'bg-primary text-primary-foreground font-bold',
                          )}
                        >
                          {format(d, 'd')}
                        </span>
                      </div>
                      {cards.map((c, idx) => {
                        const cardLabels = (c.labels ?? [])
                          .map((id) => labelMap.get(id))
                          .filter(Boolean) as Label[];
                        return (
                          <Draggable key={c._id} draggableId={c._id} index={idx}>
                            {(p, snap) => (
                              <button
                                ref={p.innerRef}
                                {...p.draggableProps}
                                {...p.dragHandleProps}
                                onClick={() => onOpenCard(c._id)}
                                className={cn(
                                  'w-full rounded-lg border border-border/60 bg-card px-1.5 py-1 text-left text-[11px] shadow-xs transition-all duration-150 hover:border-primary/40 hover:bg-muted',
                                  snap.isDragging && 'rotate-1 shadow-md ring-2 ring-primary',
                                )}
                              >
                                {cardLabels.length > 0 && (
                                  <div className="mb-0.5 flex gap-0.5">
                                    {cardLabels.slice(0, 3).map((l) => (
                                      <span
                                        key={l._id}
                                        className="h-1 w-3 rounded-full"
                                        style={{ backgroundColor: l.color }}
                                      />
                                    ))}
                                  </div>
                                )}
                                <div className="truncate font-medium">{c.title}</div>
                              </button>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
        </div>
      </div>
    </div>
  );
}
