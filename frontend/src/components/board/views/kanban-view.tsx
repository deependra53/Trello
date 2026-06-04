'use client';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { ListColumn, instantDropStyle } from '@/components/board/list-column';
import { CardTile } from '@/components/board/card-tile';
import { AddListForm } from '@/components/board/add-list-form';
import { useMoveCard, useMoveList } from '@/hooks/use-cards';
import type { BoardFull, Card } from '@/types/api';

interface Props {
  board: BoardFull;
  onOpenCard: (cardId: string) => void;
}

export function KanbanView({ board, onOpenCard }: Props) {
  const moveCard = useMoveCard({ boardId: board._id });
  const moveList = useMoveList(board._id);

  const cardsByList = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of board.cards ?? []) {
      if (c.archived) continue;
      if (!map.has(c.listId)) map.set(c.listId, []);
      map.get(c.listId)!.push(c);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
    return map;
  }, [board]);

  const sortedLists = useMemo(
    () => [...(board.lists ?? [])].filter((l) => !l.archived).sort((a, b) => a.position - b.position),
    [board],
  );

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const clientEventId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (type === 'list') {
      const arr = [...sortedLists];
      const [moved] = arr.splice(source.index, 1);
      if (!moved) return;
      arr.splice(destination.index, 0, moved);
      const prev = arr[destination.index - 1] ?? null;
      const next = arr[destination.index + 1] ?? null;
      moveList.mutate({
        clientEventId,
        listId: draggableId,
        prevId: prev?._id ?? null,
        nextId: next?._id ?? null,
      });
      return;
    }

    // Build the destination-list array AFTER the move so the neighbors we
    // send to the server match the on-screen layout.
    const sameList = source.droppableId === destination.droppableId;
    const destCards = [...(cardsByList.get(destination.droppableId) ?? [])];
    if (sameList) destCards.splice(source.index, 1);
    const moving = board.cards.find((c) => c._id === draggableId);
    if (!moving) return;
    destCards.splice(destination.index, 0, moving);
    const prev = destCards[destination.index - 1] ?? null;
    const next = destCards[destination.index + 1] ?? null;

    moveCard.mutate({
      clientEventId,
      cardId: draggableId,
      listId: destination.droppableId,
      prevId: prev?._id ?? null,
      nextId: next?._id ?? null,
    });
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Outer flex container — AddListForm sits outside the Droppable so the
          library's placeholder is always the last child of the droppable. */}
      <div className="flex h-full items-start gap-3 overflow-x-auto overflow-y-hidden p-4 pb-24 scrollbar-thin animate-fade-up lg:pb-8">
        <Droppable
          droppableId="board"
          type="list"
          direction="horizontal"
          renderClone={(dragProvided, dragSnapshot, rubric) => {
            const draggedList = sortedLists.find((l) => l._id === rubric.draggableId);
            if (!draggedList) return <div />;
            const listCards = cardsByList.get(draggedList._id) ?? [];
            // Portal the dragged list to document.body so its `transform:
            // translate()` is measured against the viewport instead of the
            // horizontally-scrolling board container (overflow-x-auto creates
            // a containing block that throws off the drag preview's coordinate
            // math, so the list drifts away from the cursor). Same fix as the
            // card clone in list-column.tsx.
            return createPortal(
              <div
                ref={dragProvided.innerRef}
                {...dragProvided.draggableProps}
                {...dragProvided.dragHandleProps}
                style={instantDropStyle(dragProvided, dragSnapshot)}
                className="flex max-h-[calc(100vh-11rem)] w-72 shrink-0 flex-col rounded-xl border border-border/60 bg-muted p-2 shadow-lg ring-2 ring-primary/60"
              >
                <div className="mb-2 flex items-center justify-between gap-2 px-1.5">
                  <h3 className="truncate text-sm font-semibold tracking-tight">
                    {draggedList.title}
                  </h3>
                  <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full border border-border/60 bg-background px-1.5 text-[10px] font-semibold text-muted-foreground">
                    {listCards.length}
                  </span>
                </div>
                <div className="flex min-h-[40px] flex-1 flex-col gap-2 overflow-hidden rounded-lg p-1">
                  {listCards.map((card) => (
                    <CardTile key={card._id} card={card} labels={board.labels} isDragging />
                  ))}
                </div>
              </div>,
              document.body,
            );
          }}
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex items-start gap-3"
            >
              {sortedLists.map((list, idx) => (
                <ListColumn
                  key={list._id}
                  list={list}
                  cards={cardsByList.get(list._id) ?? []}
                  labels={board.labels}
                  index={idx}
                  boardId={board._id}
                  onOpenCard={onOpenCard}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <AddListForm boardId={board._id} />
      </div>
    </DragDropContext>
  );
}
