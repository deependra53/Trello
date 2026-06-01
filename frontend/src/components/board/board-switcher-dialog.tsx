'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { ChevronDown, Clock, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useWorkspaces } from '@/hooks/use-boards';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Board, Workspace } from '@/types/api';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentBoardId?: string;
}

export function BoardSwitcherDialog({ open, onOpenChange, currentBoardId }: Props) {
  const router = useRouter();
  const { data: workspaces } = useWorkspaces();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | string>('all');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const wsQueries = useQueries({
    queries: (workspaces ?? []).map((ws) => ({
      queryKey: ['workspace-boards', ws._id],
      queryFn: () =>
        api<{ items: Board[] }>(`/api/workspaces/${ws._id}/boards`).then((r) => r.items),
      enabled: open && !!ws._id,
    })),
  });

  const boardsByWs = useMemo(() => {
    const map = new Map<string, Board[]>();
    (workspaces ?? []).forEach((ws, i) => {
      map.set(ws._id, wsQueries[i]?.data ?? []);
    });
    return map;
  }, [workspaces, wsQueries]);

  const q = query.trim().toLowerCase();
  const matches = (b: Board) => !q || b.title.toLowerCase().includes(q);

  const recent = useMemo(() => {
    const list: { board: Board; workspace: Workspace }[] = [];
    (workspaces ?? []).forEach((ws) => {
      if (filter !== 'all' && filter !== ws._id) return;
      (boardsByWs.get(ws._id) ?? []).forEach((board) => {
        if (matches(board)) list.push({ board, workspace: ws });
      });
    });
    return list
      .sort(
        (a, b) =>
          +new Date(b.board.lastActivityAt || 0) - +new Date(a.board.lastActivityAt || 0),
      )
      .slice(0, 8);
  }, [workspaces, boardsByWs, filter, q]);

  const totalBoards = useMemo(
    () => Array.from(boardsByWs.values()).reduce((sum, list) => sum + list.length, 0),
    [boardsByWs],
  );
  const isLoading = wsQueries.some((wq) => wq.isLoading);

  function openBoard(id: string) {
    onOpenChange(false);
    router.push(`/boards/${id}`);
  }

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-5 sm:rounded-2xl">
        <DialogTitle className="sr-only">Switch boards</DialogTitle>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search your boards"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-9"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterChip>
          {(workspaces ?? []).map((ws) => (
            <FilterChip
              key={ws._id}
              active={filter === ws._id}
              onClick={() => setFilter(ws._id)}
            >
              {ws.name}
            </FilterChip>
          ))}
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          {recent.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Recent
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {recent.map(({ board }) => (
                  <BoardTile
                    key={board._id}
                    board={board}
                    isCurrent={board._id === currentBoardId}
                    onSelect={() => openBoard(board._id)}
                  />
                ))}
              </div>
            </section>
          )}

          {(workspaces ?? []).map((ws) => {
            if (filter !== 'all' && filter !== ws._id) return null;
            const list = (boardsByWs.get(ws._id) ?? []).filter(matches);
            if (!list.length) return null;
            const isCollapsed = collapsed.has(ws._id);
            return (
              <section key={ws._id} className="mt-6">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(ws._id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                  {ws.name}
                </button>
                {!isCollapsed && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {list.map((board) => (
                      <BoardTile
                        key={board._id}
                        board={board}
                        isCurrent={board._id === currentBoardId}
                        onSelect={() => openBoard(board._id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {!isLoading && totalBoards === 0 && (
            <div className="grid place-items-center py-12 text-sm text-muted-foreground">
              No boards yet
            </div>
          )}
          {isLoading && totalBoards === 0 && (
            <div className="grid place-items-center py-12 text-sm text-muted-foreground">
              Loading boards…
            </div>
          )}
          {!isLoading && totalBoards > 0 && recent.length === 0 && q && (
            <div className="grid place-items-center py-12 text-sm text-muted-foreground">
              No boards match “{query}”
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function BoardTile({
  board,
  isCurrent,
  onSelect,
}: {
  board: Board;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const bgStyle =
    board.background?.type === 'gradient'
      ? { backgroundImage: board.background.value }
      : { backgroundColor: board.background?.value ?? '#795DFF' };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative aspect-[16/9] overflow-hidden rounded-lg text-left shadow-sm transition hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isCurrent && 'ring-2 ring-primary ring-offset-2',
      )}
      style={bgStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <span className="line-clamp-2 text-xs font-semibold text-white drop-shadow">
          {board.title}
        </span>
      </div>
    </button>
  );
}
