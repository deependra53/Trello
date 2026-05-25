'use client';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Card as CardType, Label, List } from '@/types/api';
import { CardTile } from './card-tile';
import { AddCardForm } from './add-card-form';
import { Button } from '@/components/ui/button';

interface Props {
  list: List;
  cards: CardType[];
  labels: Label[];
  index: number;
  boardId: string;
  onOpenCard: (cardId: string) => void;
}

export function ListColumn({ list, cards, labels, index, boardId, onOpenCard }: Props) {
  return (
    <Draggable draggableId={list._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'flex max-h-[calc(100vh-9.5rem)] w-72 shrink-0 flex-col rounded-xl bg-muted/90 p-2 shadow-soft backdrop-blur-sm',
            snapshot.isDragging && 'rotate-1 ring-2 ring-primary',
          )}
        >
          <div
            {...provided.dragHandleProps}
            className="mb-2 flex items-center justify-between px-1.5"
          >
            <h3 className="text-sm font-semibold">{list.title}</h3>
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {cards.length}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Droppable droppableId={list._id} type="card">
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={cn(
                  'flex flex-1 flex-col gap-2 overflow-y-auto rounded-md p-1 scrollbar-thin transition-colors',
                  dropSnapshot.isDraggingOver && 'bg-accent/40',
                )}
              >
                {cards.map((card, i) => (
                  <Draggable key={card._id} draggableId={card._id} index={i}>
                    {(cardProvided, cardSnapshot) => (
                      <div
                        ref={cardProvided.innerRef}
                        {...cardProvided.draggableProps}
                        {...cardProvided.dragHandleProps}
                      >
                        <CardTile
                          card={card}
                          labels={labels}
                          onOpen={() => onOpenCard(card._id)}
                          isDragging={cardSnapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="mt-2">
            <AddCardForm boardId={boardId} listId={list._id} />
          </div>
        </div>
      )}
    </Draggable>
  );
}
