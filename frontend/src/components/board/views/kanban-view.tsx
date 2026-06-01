'use client';
import { useMemo } from 'react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { ListColumn } from '@/components/board/list-column';
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
      <div className="flex h-full items-start gap-3 overflow-x-auto overflow-y-hidden p-4 pb-8 scrollbar-thin">
        <Droppable droppableId="board" type="list" direction="horizontal">
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
