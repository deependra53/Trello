'use client';
import { useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { ArrowLeft, Filter, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ListColumn } from '@/components/board/list-column';
import { AddListForm } from '@/components/board/add-list-form';
import { CardModal } from '@/components/card/card-modal';
import { useBoard, useStarBoard } from '@/hooks/use-boards';
import { useMoveCard, useMoveList } from '@/hooks/use-cards';
import { useBoardRealtime } from '@/hooks/use-realtime';
import type { Card } from '@/types/api';
import { cn, getInitials } from '@/lib/utils';
import Link from 'next/link';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const openCardId = sp.get('card');

  useBoardRealtime(boardId);
  const { data: board, isLoading } = useBoard(boardId);
  const moveCard = useMoveCard({ boardId });
  const moveList = useMoveList(boardId);
  const star = useStarBoard(boardId);

  const cardsByList = useMemo(() => {
    const map = new Map<string, Card[]>();
    for (const c of board?.cards ?? []) {
      if (!map.has(c.listId)) map.set(c.listId, []);
      map.get(c.listId)!.push(c);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
    return map;
  }, [board]);

  const sortedLists = useMemo(
    () => [...(board?.lists ?? [])].sort((a, b) => a.position - b.position),
    [board],
  );

  function openCard(id: string) {
    const params = new URLSearchParams(sp.toString());
    params.set('card', id);
    router.push(`/boards/${boardId}?${params.toString()}`, { scroll: false });
  }

  function closeCard() {
    const params = new URLSearchParams(sp.toString());
    params.delete('card');
    const q = params.toString();
    router.push(`/boards/${boardId}${q ? '?' + q : ''}`, { scroll: false });
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    if (type === 'list') {
      const arr = [...sortedLists];
      const [moved] = arr.splice(source.index, 1);
      if (!moved) return;
      arr.splice(destination.index, 0, moved);
      const prev = arr[destination.index - 1] ?? null;
      const next = arr[destination.index + 1] ?? null;
      moveList.mutate({
        listId: draggableId,
        prevId: prev?._id ?? null,
        nextId: next?._id ?? null,
      });
      return;
    }

    // type === 'card'
    const destCards = [...(cardsByList.get(destination.droppableId) ?? [])];
    const srcCards =
      source.droppableId === destination.droppableId
        ? destCards
        : [...(cardsByList.get(source.droppableId) ?? [])];
    if (source.droppableId === destination.droppableId) {
      destCards.splice(source.index, 1);
    } else {
      srcCards.splice(source.index, 1);
    }
    const moving = (board?.cards ?? []).find((c) => c._id === draggableId);
    if (!moving) return;
    destCards.splice(destination.index, 0, moving);
    const prev = destCards[destination.index - 1] ?? null;
    const next = destCards[destination.index + 1] ?? null;
    moveCard.mutate({
      cardId: draggableId,
      listId: destination.droppableId,
      prevId: prev?._id ?? null,
      nextId: next?._id ?? null,
    });
  }

  if (isLoading) return <BoardSkeleton />;
  if (!board) {
    return (
      <div className="grid h-[80vh] place-items-center text-sm text-muted-foreground">
        Board not found
      </div>
    );
  }

  const bgStyle =
    board.background?.type === 'gradient'
      ? { backgroundImage: board.background.value }
      : { backgroundColor: board.background?.value ?? '#795DFF' };

  const isStarred = (board.starredBy ?? []).length > 0;
  const openCard_ = openCardId ? board.cards.find((c) => c._id === openCardId) : undefined;

  return (
    <div className="relative min-h-[calc(100vh-4rem)]" style={bgStyle}>
      <div className="absolute inset-0 bg-black/15" />
      <div className="relative z-10 flex flex-col">
        <BoardHeader
          title={board.title}
          memberCount={board.members?.length ?? 0}
          isStarred={isStarred}
          onStar={() => {
            star.mutate(undefined, {
              onSuccess: (r) => toast.success(r.starred ? 'Starred!' : 'Unstarred'),
            });
          }}
        />
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="list" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-1 items-start gap-3 overflow-x-auto p-4 pb-8 scrollbar-thin"
              >
                {sortedLists.map((list, idx) => (
                  <ListColumn
                    key={list._id}
                    list={list}
                    cards={cardsByList.get(list._id) ?? []}
                    labels={board.labels}
                    index={idx}
                    boardId={board._id}
                    onOpenCard={openCard}
                  />
                ))}
                {provided.placeholder}
                <AddListForm boardId={board._id} />
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      {openCard_ && (
        <CardModal card={openCard_} board={board} open onClose={closeCard} />
      )}
    </div>
  );
}

function BoardHeader({
  title,
  memberCount,
  isStarred,
  onStar,
}: {
  title: string;
  memberCount: number;
  isStarred: boolean;
  onStar: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-black/20 px-4 py-3 backdrop-blur-md">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/15 hover:text-white"
      >
        <Link href="/boards" aria-label="Back to boards">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <h1 className="truncate text-lg font-semibold text-white drop-shadow">{title}</h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={onStar}
        className="text-white hover:bg-white/15 hover:text-white"
        aria-label="Star"
      >
        <Star
          className={cn('h-5 w-5', isStarred && 'fill-yellow-300 text-yellow-300')}
        />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-white hover:bg-white/15 hover:text-white"
        >
          <Filter className="h-4 w-4" /> Filter
        </Button>
        <div className="hidden items-center -space-x-1 sm:flex">
          {Array.from({ length: Math.min(memberCount, 4) }).map((_, i) => (
            <Avatar key={i} className="h-7 w-7 border-2 border-white/40">
              <AvatarFallback className="bg-white text-[10px] font-bold text-primary">
                {getInitials(String.fromCharCode(65 + i))}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-white hover:bg-white/15 hover:text-white"
        >
          <Users className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center" style={{ backgroundColor: '#795DFF' }}>
      <div className="text-sm text-white/80">Loading board…</div>
    </div>
  );
}
