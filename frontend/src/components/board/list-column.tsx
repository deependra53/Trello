'use client';
import { createPortal } from 'react-dom';
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
            // bg-muted (solid) + no backdrop-filter — both `backdrop-filter`
            // and `overflow` create new containing blocks that throw off the
            // drag preview's coordinate math. The portaled clone (below) is
            // what fixes the visible-position issue, but keeping the column
            // free of filter ancestors is the defensive belt-and-braces.
            'flex max-h-[calc(100vh-9.5rem)] w-72 shrink-0 flex-col rounded-xl bg-muted p-2 shadow-soft',
            snapshot.isDragging && 'rotate-1 ring-2 ring-primary',
          )}
        >
          <div
            {...provided.dragHandleProps}
            className="drag-handle mb-2 flex items-center justify-between px-1.5"
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

          <Droppable
            droppableId={list._id}
            type="card"
            renderClone={(dragProvided, _dragSnapshot, rubric) => {
              const dragged = cards.find((c) => c._id === rubric.draggableId);
              if (!dragged) return <div />;
              // Portal the dragged card to document.body so its `transform:
              // translate()` is calculated against the viewport instead of
              // any clipping/transforming ancestor (overflow-y-auto on the
              // droppable body, etc.). This fixes both the visual offset
              // and the "card disappears when dragged out of its list".
              return createPortal(
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  {...dragProvided.dragHandleProps}
                  className="drag-handle w-72"
                >
                  <CardTile card={dragged} labels={labels} isDragging />
                </div>,
                document.body,
              );
            }}
          >
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={cn(
                  'flex min-h-[40px] flex-1 flex-col gap-2 overflow-y-auto rounded-md p-1 scrollbar-thin transition-colors',
                  dropSnapshot.isDraggingOver && 'bg-accent/40 ring-2 ring-primary/30',
                )}
              >
                {cards.map((card, i) => (
                  <Draggable key={card._id} draggableId={card._id} index={i}>
                    {(cardProvided) => (
                      <div
                        ref={cardProvided.innerRef}
                        {...cardProvided.draggableProps}
                        {...cardProvided.dragHandleProps}
                        className="drag-handle"
                      >
                        <CardTile
                          card={card}
                          labels={labels}
                          onOpen={() => onOpenCard(card._id)}
                          isDragging={false}
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
