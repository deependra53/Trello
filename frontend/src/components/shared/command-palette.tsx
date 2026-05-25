'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Calendar,
  Inbox,
  LayoutGrid,
  Layers,
  Search,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { api } from '@/lib/api';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import type { Board, Card, User } from '@/types/api';

interface SearchResult {
  cards: (Card & { boardId: string })[];
  boards: Board[];
  members: User[];
}

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const [q, setQ] = useState('');

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  // Reset query on close
  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ['search', q],
    queryFn: () =>
      api<SearchResult>('/api/search', { query: { q } }).then((r) => r),
    enabled: open && q.trim().length > 1,
    staleTime: 30_000,
  });

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  const navItems = [
    { href: '/boards', label: 'All boards', icon: LayoutGrid },
    { href: '/inbox', label: 'Inbox', icon: Inbox },
    { href: '/planner', label: 'Planner', icon: Calendar },
    { href: '/templates', label: 'Templates', icon: Layers },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 sm:max-w-2xl">
        <Command shouldFilter={false} loop className="flex flex-col">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Search boards, cards, members…"
              value={q}
              onValueChange={setQ}
              className="flex h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="ml-2 rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              esc
            </kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
            {q.trim().length <= 1 && (
              <Command.Group heading="Navigate" className="text-xs text-muted-foreground">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Command.Item
                    key={href}
                    onSelect={() => navigate(href)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {q.trim().length > 1 && isFetching && (
              <div className="p-4 text-center text-sm text-muted-foreground">Searching…</div>
            )}

            {data && data.cards.length > 0 && (
              <Command.Group heading="Cards" className="mt-2 text-xs text-muted-foreground">
                {data.cards.map((c) => (
                  <Command.Item
                    key={c._id}
                    onSelect={() => navigate(`/boards/${c.boardId}?card=${c._id}`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-accent"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{c.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data && data.boards.length > 0 && (
              <Command.Group heading="Boards" className="mt-2 text-xs text-muted-foreground">
                {data.boards.map((b) => (
                  <Command.Item
                    key={b._id}
                    onSelect={() => navigate(`/boards/${b._id}`)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-accent"
                  >
                    <div
                      className="h-3.5 w-3.5 rounded"
                      style={
                        b.background?.type === 'gradient'
                          ? { backgroundImage: b.background.value }
                          : { backgroundColor: b.background?.value ?? '#795DFF' }
                      }
                    />
                    {b.title}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data && data.members.length > 0 && (
              <Command.Group heading="Members" className="mt-2 text-xs text-muted-foreground">
                {data.members.map((m) => (
                  <Command.Item
                    key={m._id}
                    value={`member-${m._id}`}
                    onSelect={() => {}}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-accent"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> {m.fullName}{' '}
                    <span className="text-xs text-muted-foreground">({m.email})</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {q.trim().length > 1 && data && data.cards.length === 0 && data.boards.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No results for &ldquo;{q}&rdquo;.
              </div>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
