'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { Check, ChevronDown, LayoutList, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspaces } from '@/hooks/use-boards';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { bgStyleOf, iconForTitle, shortAgo } from '@/lib/board-visuals';
import type { Board } from '@/types/api';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentBoardId?: string;
}

interface BoardEntry {
  board: Board;
  workspaceName: string;
}

type SortKey = 'recent' | 'alpha' | 'tasks';
const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Recent',
  alpha: 'Alphabetical',
  tasks: 'Most tasks',
};

const RECENT_LIMIT = 8;

export function BoardSwitcherDialog({ open, onOpenChange, currentBoardId }: Props) {
  const router = useRouter();
  const { data: workspaces, isLoading: wsLoading } = useWorkspaces();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  const wsQueries = useQueries({
    queries: (workspaces ?? []).map((ws) => ({
      queryKey: ['workspace-boards', ws._id],
      queryFn: () =>
        api<{ items: Board[] }>(`/api/workspaces/${ws._id}/boards`).then((r) => r.items),
      enabled: open && !!ws._id,
    })),
  });

  const isLoading = wsLoading || wsQueries.some((wq) => wq.isLoading);

  const allBoards = useMemo<BoardEntry[]>(() => {
    const list: BoardEntry[] = [];
    (workspaces ?? []).forEach((ws, i) => {
      (wsQueries[i]?.data ?? []).forEach((board) => list.push({ board, workspaceName: ws.name }));
    });
    return list;
  }, [workspaces, wsQueries]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      allBoards.filter(
        (e) =>
          !q ||
          e.board.title.toLowerCase().includes(q) ||
          e.workspaceName.toLowerCase().includes(q),
      ),
    [allBoards, q],
  );

  const byRecency = (a: BoardEntry, b: BoardEntry) =>
    +new Date(b.board.lastActivityAt || 0) - +new Date(a.board.lastActivityAt || 0);

  const recent = useMemo(
    () => [...filtered].sort(byRecency).slice(0, RECENT_LIMIT),
    [filtered],
  );

  const sorted = useMemo(() => {
    const items = [...filtered];
    items.sort((a, b) => {
      if (sort === 'alpha') return a.board.title.localeCompare(b.board.title);
      if (sort === 'tasks') return (b.board.cardCount ?? 0) - (a.board.cardCount ?? 0);
      return byRecency(a, b);
    });
    return items;
  }, [filtered, sort]);

  // Recent is a quick-access strip shown only on the default (non-search) view;
  // "All boards" then lists the rest so cards never appear twice.
  const showRecent = !q && recent.length > 0;
  const recentIds = useMemo(
    () => new Set(showRecent ? recent.map((e) => e.board._id) : []),
    [showRecent, recent],
  );
  const allList = useMemo(
    () => sorted.filter((e) => !recentIds.has(e.board._id)),
    [sorted, recentIds],
  );

  function openBoard(id: string) {
    onOpenChange(false);
    router.push(`/boards/${id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
        {/* Header: title + subtitle on the left, search on the right */}
        <div className="flex flex-col gap-4 border-b border-border/60 p-5 pr-12 sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:pr-16">
          <div className="min-w-0">
            <DialogTitle className="text-xl font-bold tracking-tight">Switch board</DialogTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">Select a board to switch to</p>
          </div>
          <div className="relative sm:ml-auto sm:w-[22rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search boards..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-9 pr-12"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center rounded-md border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[64vh] overflow-y-auto p-5 scrollbar-thin sm:p-6">
          {isLoading ? (
            <LoadingSection />
          ) : allBoards.length === 0 ? (
            <EmptyState
              title="No boards yet"
              subtitle="Create a board and it will show up here."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={`No boards match “${query}”`}
              subtitle="Try a different search term."
            />
          ) : (
            <>
              {showRecent && (
                <section className={cn(allList.length > 0 && 'mb-7')}>
                  <SectionLabel>Recent</SectionLabel>
                  <CardGrid>
                    {recent.map((e) => (
                      <BoardCard
                        key={e.board._id}
                        entry={e}
                        isCurrent={e.board._id === currentBoardId}
                        onSelect={() => openBoard(e.board._id)}
                      />
                    ))}
                  </CardGrid>
                </section>
              )}

              {allList.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <SectionLabel className="mb-0">All boards</SectionLabel>
                    <SortMenu value={sort} onChange={setSort} />
                  </div>
                  <CardGrid>
                    {allList.map((e) => (
                      <BoardCard
                        key={e.board._id}
                        entry={e}
                        isCurrent={e.board._id === currentBoardId}
                        onSelect={() => openBoard(e.board._id)}
                      />
                    ))}
                  </CardGrid>
                </section>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
  );
}

function SortMenu({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Sort by: <span className="text-foreground">{SORT_LABELS[value]}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <DropdownMenuItem key={k} onClick={() => onChange(k)}>
            <Check
              className={cn('h-3.5 w-3.5 text-primary', k === value ? 'opacity-100' : 'opacity-0')}
            />
            {SORT_LABELS[k]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BoardCard({
  entry,
  isCurrent,
  onSelect,
}: {
  entry: BoardEntry;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const { board, workspaceName } = entry;
  const Icon = iconForTitle(board.title);
  const count = board.cardCount ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isCurrent ? 'true' : undefined}
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isCurrent ? 'border-primary/60 ring-1 ring-primary/40' : 'border-border/60',
      )}
    >
      {isCurrent && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}

      <div className="flex items-start gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm"
          style={bgStyleOf(board.background)}
        >
          <Icon className="h-[1.35rem] w-[1.35rem] drop-shadow-sm" />
        </span>
        <div className={cn('min-w-0 flex-1 pt-0.5', isCurrent && 'pr-5')}>
          <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">
            {board.title}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{workspaceName}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <LayoutList className="h-3.5 w-3.5" />
          {count} {count === 1 ? 'task' : 'tasks'}
        </span>
        <span>{shortAgo(board.lastActivityAt)}</span>
      </div>
    </button>
  );
}

function LoadingSection() {
  return (
    <section>
      <div className="skeleton mb-3 h-3 w-16 rounded" />
      <CardGrid>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-[6.25rem] rounded-2xl" />
        ))}
      </CardGrid>
    </section>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="grid place-items-center gap-3 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Search className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}
