'use client';
import { useMemo, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Sparkles,
  Star,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { bgStyleOf, colorForId, iconForTitle, shortAgo } from '@/lib/board-visuals';
import { useStarBoard, useWorkspaceBoards, useWorkspaces } from '@/hooks/use-boards';
import { useBoardLink } from '@/hooks/use-board-link';
import { BoardSkeleton } from '@/components/board/board-skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateBoardDialog } from '@/components/board/create-board-dialog';
import type { Board } from '@/types/api';

/** Shared instant-navigation handlers, created once in `BoardsHome`. */
type BoardNav = {
  open: (boardId: string, e?: MouseEvent) => void;
  prefetch: (boardId: string) => void;
};

/** Intent + click handlers to spread onto a board `<Link>`. */
function navLinkProps(nav: BoardNav, boardId: string) {
  return {
    onMouseEnter: () => nav.prefetch(boardId),
    onFocus: () => nav.prefetch(boardId),
    onPointerDown: () => nav.prefetch(boardId),
    onClick: (e: MouseEvent) => nav.open(boardId, e),
  };
}

function BoardCard({
  board,
  workspaceName,
  nav,
}: {
  board: Board;
  workspaceName: string;
  nav: BoardNav;
}) {
  const star = useStarBoard(board._id);
  const Icon = iconForTitle(board.title);
  const members = board.members ?? [];
  const starred = (board.starredBy?.length ?? 0) > 0;

  return (
    <div
      className="group relative flex min-h-[15rem] flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
      style={bgStyleOf(board.background)}
    >
      <Link
        href={`/boards/${board._id}`}
        aria-label={board.title}
        {...navLinkProps(nav, board._id)}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      {/* Header */}
      <div className="pointer-events-none relative z-10 flex items-start gap-3 p-4 text-white">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/25 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold leading-tight drop-shadow-sm">{board.title}</h3>
          <p className="truncate text-xs text-white/80">{workspaceName}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Board options"
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto relative z-20 grid h-7 w-7 place-items-center rounded-lg text-white/80 outline-none transition-colors hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/boards/${board._id}`} {...navLinkProps(nav, board._id)}>
                Open board
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => star.mutate()}>
              <Star className={cn('mr-2 h-4 w-4', starred && 'fill-amber-400 text-amber-400')} />
              {starred ? 'Unstar board' : 'Star board'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mini board preview */}
      <div className="pointer-events-none relative z-10 flex gap-1.5 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg bg-white/15 p-1.5">
            <div className="h-1.5 w-3/4 rounded-full bg-white/45" />
            {Array.from({ length: 2 }).map((__, j) => (
              <div key={j} className="rounded-md bg-white/25 p-1">
                <div className="h-1 rounded-full bg-white/60" style={{ width: j ? '60%' : '85%' }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pointer-events-none relative z-10 mt-auto flex items-center gap-2 p-4 text-white">
        {members.length > 0 && (
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m) => (
              <span
                key={m.userId}
                className="grid h-6 w-6 place-items-center rounded-full text-white ring-2 ring-white/60"
                style={{ backgroundColor: colorForId(m.userId) }}
              >
                <UserRound className="h-3 w-3" />
              </span>
            ))}
          </div>
        )}
        <span className="truncate text-xs font-medium text-white/85">
          {members.length} member{members.length === 1 ? '' : 's'} · Updated{' '}
          {shortAgo(board.lastActivityAt)}
        </span>
        {starred && (
          <Star className="ml-auto h-4 w-4 shrink-0 fill-amber-300 text-amber-300 drop-shadow" />
        )}
      </div>
    </div>
  );
}

function BoardRow({
  board,
  workspaceName,
  nav,
}: {
  board: Board;
  workspaceName: string;
  nav: BoardNav;
}) {
  const Icon = iconForTitle(board.title);
  const members = board.members ?? [];
  const starred = (board.starredBy?.length ?? 0) > 0;

  return (
    <Link
      href={`/boards/${board._id}`}
      {...navLinkProps(nav, board._id)}
      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm outline-none transition-all hover:border-primary/30 hover:shadow focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white shadow-sm"
        style={bgStyleOf(board.background)}
      >
        <Icon className="h-5 w-5 drop-shadow" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-semibold tracking-tight">{board.title}</h3>
          {starred && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {workspaceName} · {members.length} member{members.length === 1 ? '' : 's'}
        </p>
      </div>
      <span className="hidden text-xs text-muted-foreground sm:block">
        Updated {shortAgo(board.lastActivityAt)}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function CreateTile({ workspaceId }: { workspaceId: string }) {
  return (
    <CreateBoardDialog workspaceId={workspaceId}>
      <button
        type="button"
        className="group flex min-h-[15rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center outline-none transition-all hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Plus className="h-6 w-6" />
        </span>
        <span className="text-sm font-semibold text-foreground">Create new board</span>
        <span className="text-xs text-muted-foreground">Start fresh with a blank board</span>
      </button>
    </CreateBoardDialog>
  );
}

function WorkspaceSection({
  workspaceId,
  name,
  nav,
}: {
  workspaceId: string;
  name: string;
  nav: BoardNav;
}) {
  const { data: boards, isLoading } = useWorkspaceBoards(workspaceId);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<'recent' | 'alpha'>('recent');

  const sorted = useMemo(() => {
    const items = [...(boards ?? [])];
    items.sort((a, b) =>
      sort === 'alpha'
        ? a.title.localeCompare(b.title)
        : new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
    );
    return items;
  }, [boards, sort]);

  return (
    <section className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg brand-gradient text-sm font-bold text-primary-foreground shadow-glow-sm">
          {name[0]?.toUpperCase()}
        </div>
        <h2 className="min-w-0 truncate text-lg font-semibold tracking-tight">{name}</h2>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {boards?.length ?? 0} boards
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border/60 bg-card p-0.5">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setView('grid')}
              className={cn(
                'grid h-8 w-8 place-items-center rounded-md transition-colors',
                view === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setView('list')}
              className={cn(
                'grid h-8 w-8 place-items-center rounded-md transition-colors',
                view === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'recent' | 'alpha')}
              className="h-9 appearance-none rounded-lg border border-border/60 bg-card pl-3 pr-9 text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="recent">Recently updated</option>
              <option value="alpha">Alphabetical</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-[15rem] rounded-2xl" />
            ))}
          </div>
        ) : view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((b) => (
              <BoardCard key={b._id} board={b} workspaceName={name} nav={nav} />
            ))}
            <CreateTile workspaceId={workspaceId} />
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((b) => (
              <BoardRow key={b._id} board={b} workspaceName={name} nav={nav} />
            ))}
            <CreateBoardDialog workspaceId={workspaceId}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-3 text-left outline-none transition-all hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-muted-foreground">Create new board</span>
              </button>
            </CreateBoardDialog>
          </div>
        )}
      </div>
    </section>
  );
}

function TemplatesBanner() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold tracking-tight">Save time with templates</p>
          <p className="text-sm text-muted-foreground">
            Choose from expert-made templates and get started in seconds.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" className="text-primary hover:text-primary">
          <Link href="/templates">Browse templates</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/settings">
            <UserPlus className="h-4 w-4" />
            Invite members
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid animate-fade-up place-items-center rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-20 text-center shadow-sm">
      <div className="grid h-16 w-16 place-items-center rounded-2xl brand-gradient text-primary-foreground shadow-glow">
        <Plus className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-bold tracking-tight">Create your first board</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Boards organize your work into lists and cards. A workspace will be created automatically
        for you.
      </p>
      <div className="mt-6">
        <CreateBoardDialog>
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" /> Create your first board
          </Button>
        </CreateBoardDialog>
      </div>
    </div>
  );
}

export function BoardsHome() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { isPending, open, prefetch } = useBoardLink();
  const nav: BoardNav = { open, prefetch };

  // The instant a board link is clicked, swap the whole list for the board
  // skeleton (which fills <main>, exactly the region the real board loads into).
  // This makes the click read as immediate instead of frozen for the 2-3s the
  // route takes, and removes the list so impatient re-clicks can't stack. The
  // route's loading.tsx renders the same skeleton, so the hand-off is seamless.
  if (isPending) return <BoardSkeleton />;

  return (
    <div className="container max-w-7xl py-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Your boards</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick up where you left off, or start something new.
          </p>
        </div>
        <CreateBoardDialog />
      </div>

      <div className="mt-10 space-y-12">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-[15rem] rounded-2xl" />
            ))}
          </div>
        ) : !workspaces || workspaces.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {workspaces.map((ws) => (
              <WorkspaceSection key={ws._id} workspaceId={ws._id} name={ws.name} nav={nav} />
            ))}
            <TemplatesBanner />
          </>
        )}
      </div>
    </div>
  );
}
