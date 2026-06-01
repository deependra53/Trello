'use client';
import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CardModal } from '@/components/card/card-modal';
import { ViewSwitcher, type BoardViewKind } from '@/components/board/view-switcher';
import { BoardBottomNav } from '@/components/board/board-bottom-nav';
import { BoardSwitcherDialog } from '@/components/board/board-switcher-dialog';
import {
  BoardFilterPopover,
  applyBoardFilter,
  emptyFilter,
  type BoardFilter,
} from '@/components/board/board-filter-popover';
import { KanbanView } from '@/components/board/views/kanban-view';
import { CalendarView } from '@/components/board/views/calendar-view';
import { TimelineView } from '@/components/board/views/timeline-view';
import { TableView } from '@/components/board/views/table-view';
import { DashboardView } from '@/components/board/views/dashboard-view';
import { MapView } from '@/components/board/views/map-view';
import { useBoard, useStarBoard } from '@/hooks/use-boards';
import { useBoardRealtime } from '@/hooks/use-realtime';
import { cn, getInitials } from '@/lib/utils';

const ALLOWED_VIEWS: BoardViewKind[] = ['board', 'calendar', 'timeline', 'table', 'dashboard', 'map'];

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const viewParam = sp.get('view') as BoardViewKind | null;
  const view: BoardViewKind = viewParam && ALLOWED_VIEWS.includes(viewParam) ? viewParam : 'board';
  const openCardId = sp.get('card');

  useBoardRealtime(boardId);
  const { data: board, isLoading } = useBoard(boardId);
  const star = useStarBoard(boardId);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [filter, setFilter] = useState<BoardFilter>(emptyFilter);

  function setView(v: BoardViewKind) {
    const params = new URLSearchParams(sp.toString());
    if (v === 'board') params.delete('view');
    else params.set('view', v);
    const q = params.toString();
    router.replace(`/boards/${boardId}${q ? '?' + q : ''}`, { scroll: false });
  }

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

  if (isLoading) return <BoardSkeleton />;
  if (!board) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
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
  const filteredBoard = { ...board, cards: applyBoardFilter(board.cards, filter) };

  return (
    <div className="relative flex h-full flex-col" style={bgStyle}>
      <div className="pointer-events-none absolute inset-0 bg-black/15" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-3 bg-black/25 px-4 py-3 backdrop-blur-md">
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
          <h1 className="truncate text-lg font-semibold text-white drop-shadow">{board.title}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              star.mutate(undefined, {
                onSuccess: (r) => toast.success(r.starred ? 'Starred!' : 'Unstarred'),
              })
            }
            className="text-white hover:bg-white/15 hover:text-white"
            aria-label="Star"
          >
            <Star className={cn('h-5 w-5', isStarred && 'fill-yellow-300 text-yellow-300')} />
          </Button>

          <div className="mx-auto md:mx-0 md:ml-4">
            <ViewSwitcher current={view} onChange={setView} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <BoardFilterPopover board={board} filter={filter} onChange={setFilter} />
            <div className="hidden items-center -space-x-1 sm:flex">
              {Array.from({ length: Math.min(board.members?.length ?? 0, 4) }).map((_, i) => (
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

        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'board' && <KanbanView board={filteredBoard} onOpenCard={openCard} />}
          {view === 'calendar' && <CalendarView board={filteredBoard} onOpenCard={openCard} />}
          {view === 'timeline' && <TimelineView board={filteredBoard} onOpenCard={openCard} />}
          {view === 'table' && <TableView board={filteredBoard} onOpenCard={openCard} />}
          {view === 'dashboard' && <DashboardView board={filteredBoard} />}
          {view === 'map' && <MapView board={filteredBoard} onOpenCard={openCard} />}
        </div>
      </div>
      {openCard_ && <CardModal card={openCard_} board={board} open onClose={closeCard} />}
      <BoardBottomNav onSwitchBoards={() => setSwitcherOpen(true)} />
      <BoardSwitcherDialog
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        currentBoardId={boardId}
      />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div
      className="grid h-full place-items-center"
      style={{ backgroundColor: '#795DFF' }}
    >
      <div className="text-sm text-white/80">Loading board…</div>
    </div>
  );
}
