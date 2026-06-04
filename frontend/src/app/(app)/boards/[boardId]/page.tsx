'use client';
import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CardModal } from '@/components/card/card-modal';
import { BoardShareDialog } from '@/components/board/board-share-dialog';
import { UserAvatar } from '@/components/chat/user-avatar';
import { ViewSwitcher, type BoardViewKind } from '@/components/board/view-switcher';
import { BoardBottomNav } from '@/components/board/board-bottom-nav';
import { BoardSwitcherDialog } from '@/components/board/board-switcher-dialog';
import {
  BoardFilterPopover,
  applyBoardFilter,
  emptyFilter,
  type BoardFilter,
} from '@/components/board/board-filter-popover';
import { BoardSkeleton } from '@/components/board/board-skeleton';
import { KanbanView } from '@/components/board/views/kanban-view';
import { CalendarView } from '@/components/board/views/calendar-view';
import { TimelineView } from '@/components/board/views/timeline-view';
import { TableView } from '@/components/board/views/table-view';
import { DashboardView } from '@/components/board/views/dashboard-view';
import { MapView } from '@/components/board/views/map-view';
import { useBoard, useStarBoard } from '@/hooks/use-boards';
import { useBoardRealtime, useBoardCommentRealtime } from '@/hooks/use-realtime';
import { useAuthStore } from '@/stores/auth';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

const ALLOWED_VIEWS: BoardViewKind[] = ['board', 'calendar', 'timeline', 'table', 'dashboard', 'map'];

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const viewParam = sp.get('view') as BoardViewKind | null;
  const view: BoardViewKind = viewParam && ALLOWED_VIEWS.includes(viewParam) ? viewParam : 'board';
  const openCardId = sp.get('card');

  useBoardRealtime(boardId);
  const currentUserId = useAuthStore((s) => s.user?._id);
  useBoardCommentRealtime(boardId, openCardId, currentUserId);
  const { data: board, isLoading, error } = useBoard(boardId);
  const star = useStarBoard(boardId);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
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
  if (error instanceof ApiError && error.status === 403) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="flex flex-col items-center text-center animate-fade-up">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium">You do not have access to view the board tasks</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ask a board admin to add you, then open the link again.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
            <Link href="/boards">Back to boards</Link>
          </Button>
        </div>
      </div>
    );
  }
  if (!board) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="flex flex-col items-center text-center animate-fade-up">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Star className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium">Board not found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            It may have been deleted or you don&apos;t have access.
          </p>
        </div>
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
    // Fade the real board colour in over the neutral `bg-background` base so it
    // materialises smoothly instead of flashing the default purple first.
    <div className="relative flex h-full flex-col animate-fade-in" style={bgStyle}>
      <div className="pointer-events-none absolute inset-0 bg-black/15" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/40 px-3 py-2.5 sm:gap-3 sm:px-4">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-white transition-colors hover:bg-white/15 hover:text-white"
          >
            <Link href="/boards" aria-label="Back to boards">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="truncate text-lg font-bold tracking-tight text-white drop-shadow-sm">
            {board.title}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              star.mutate(undefined, {
                onSuccess: (r) => toast.success(r.starred ? 'Starred!' : 'Unstarred'),
              })
            }
            className="h-8 w-8 rounded-lg text-white transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Star"
          >
            <Star
              className={cn(
                'h-5 w-5 transition-colors',
                isStarred && 'fill-yellow-300 text-yellow-300',
              )}
            />
          </Button>

          <div className="mx-auto max-w-full overflow-x-auto scrollbar-thin md:mx-0 md:ml-4 md:overflow-visible">
            <ViewSwitcher current={view} onChange={setView} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <BoardFilterPopover board={board} filter={filter} onChange={setFilter} />
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              aria-label={`Board members (${board.members?.length ?? 0})`}
              className="flex items-center -space-x-1.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {(board.members ?? []).slice(0, 4).map((m) => {
                const p = board.memberProfiles?.find((mp) => mp._id === m.userId);
                return (
                  <UserAvatar
                    key={m.userId}
                    id={m.userId}
                    name={p?.fullName}
                    avatarUrl={p?.avatarUrl}
                    className="h-7 w-7 rounded-full ring-2 ring-black/30"
                  />
                );
              })}
              {(board.members?.length ?? 0) > 4 && (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[10px] font-bold text-primary ring-2 ring-black/30">
                  +{(board.members?.length ?? 0) - 4}
                </span>
              )}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMembersOpen(true)}
              className="gap-2 rounded-lg text-white transition-colors hover:bg-white/15 hover:text-white"
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
      <BoardShareDialog
        board={board}
        open={membersOpen}
        onOpenChange={setMembersOpen}
        currentUserId={currentUserId}
      />
    </div>
  );
}
