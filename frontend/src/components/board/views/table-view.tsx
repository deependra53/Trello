'use client';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ArrowUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BoardFull, Card, Label, List } from '@/types/api';

interface Props {
  board: BoardFull;
  onOpenCard: (cardId: string) => void;
}

type SortField = 'title' | 'list' | 'dueDate' | 'members';
type SortDir = 'asc' | 'desc';

export function TableView({ board, onOpenCard }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: 'list',
    dir: 'asc',
  });

  const listMap = useMemo(
    () => new Map<string, List>(board.lists.map((l) => [l._id, l])),
    [board.lists],
  );
  const labelMap = useMemo(
    () => new Map<string, Label>(board.labels.map((l) => [l._id, l])),
    [board.labels],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (board.cards ?? [])
      .filter((c) => !c.archived)
      .filter((c) =>
        !q ? true : c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q),
      );
  }, [board.cards, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sort.dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sort.field) {
        case 'title':
          return a.title.localeCompare(b.title) * dir;
        case 'list': {
          const al = listMap.get(a.listId)?.title ?? '';
          const bl = listMap.get(b.listId)?.title ?? '';
          if (al === bl) return a.position - b.position;
          return al.localeCompare(bl) * dir;
        }
        case 'dueDate': {
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return (da - db) * dir;
        }
        case 'members':
          return ((a.members?.length ?? 0) - (b.members?.length ?? 0)) * dir;
      }
    });
    return arr;
  }, [filtered, sort, listMap]);

  function toggleSort(field: SortField) {
    setSort((s) =>
      s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' },
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2 rounded-xl bg-white/95 p-3 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter cards by title or description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 border-0 shadow-none focus-visible:ring-0"
        />
        <span className="text-xs text-muted-foreground">
          {sorted.length} card{sorted.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex-1 overflow-auto rounded-xl bg-white/95 shadow-soft scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <tr className="border-b text-left text-xs text-muted-foreground">
              <Th onClick={() => toggleSort('title')} active={sort.field === 'title'}>
                Title
              </Th>
              <Th onClick={() => toggleSort('list')} active={sort.field === 'list'}>
                List
              </Th>
              <th className="px-3 py-2.5 font-semibold">Labels</th>
              <Th onClick={() => toggleSort('dueDate')} active={sort.field === 'dueDate'}>
                Due
              </Th>
              <Th onClick={() => toggleSort('members')} active={sort.field === 'members'}>
                Members
              </Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <Row key={c._id} card={c} listMap={listMap} labelMap={labelMap} onOpen={onOpenCard} />
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                  No cards match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <th className="px-3 py-2.5 font-semibold">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 transition hover:text-foreground',
          active && 'text-primary',
        )}
      >
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}

function Row({
  card,
  listMap,
  labelMap,
  onOpen,
}: {
  card: Card;
  listMap: Map<string, List>;
  labelMap: Map<string, Label>;
  onOpen: (id: string) => void;
}) {
  const cardLabels = (card.labels ?? []).map((id) => labelMap.get(id)).filter(Boolean) as Label[];
  const overdue =
    card.dueDate && !card.dueComplete && new Date(card.dueDate) < new Date();
  return (
    <tr
      className="cursor-pointer border-b transition hover:bg-muted/40"
      onClick={() => onOpen(card._id)}
    >
      <td className="px-3 py-2.5 font-medium">{card.title}</td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {listMap.get(card.listId)?.title ?? '—'}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {cardLabels.map((l) => (
            <span
              key={l._id}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name || '—'}
            </span>
          ))}
        </div>
      </td>
      <td className={cn('px-3 py-2.5 text-xs', overdue && 'text-red-600 font-semibold')}>
        {card.dueDate ? format(new Date(card.dueDate), 'MMM d, h:mm a') : '—'}
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {card.members?.length ?? 0}
      </td>
    </tr>
  );
}
