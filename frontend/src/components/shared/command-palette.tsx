'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Calendar,
  LayoutGrid,
  Layers,
  MessageSquare,
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
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/planner', label: 'Planner', icon: Calendar },
    { href: '/templates', label: 'Templates', icon: Layers },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl p-0 shadow-xl sm:max-w-2xl">
        <Command shouldFilter={false} loop className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border/60 px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Search boards, cards, members…"
              value={q}
              onValueChange={setQ}
              className="flex h-12 w-full bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="shrink-0 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              esc
            </kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
            {q.trim().length <= 1 && (
              <Command.Group
                heading="Navigate"
                className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Command.Item
                    key={href}
                    onSelect={() => navigate(href)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" /> {label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {q.trim().length > 1 && isFetching && (
              <div className="space-y-1.5 p-2">
                <div className="skeleton h-9 w-full rounded-lg" />
                <div className="skeleton h-9 w-full rounded-lg" />
                <div className="skeleton h-9 w-3/4 rounded-lg" />
              </div>
            )}

            {data && data.cards.length > 0 && (
              <Command.Group
                heading="Cards"
                className="mt-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {data.cards.map((c) => (
                  <Command.Item
                    key={c._id}
                    onSelect={() => navigate(`/boards/${c.boardId}?card=${c._id}`)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{c.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data && data.boards.length > 0 && (
              <Command.Group
                heading="Boards"
                className="mt-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {data.boards.map((b) => (
                  <Command.Item
                    key={b._id}
                    onSelect={() => navigate(`/boards/${b._id}`)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                  >
                    <div
                      className="h-3.5 w-3.5 shrink-0 rounded ring-1 ring-inset ring-black/10"
                      style={
                        b.background?.type === 'gradient'
                          ? { backgroundImage: b.background.value }
                          : { backgroundColor: b.background?.value ?? '#795DFF' }
                      }
                    />
                    <span className="truncate">{b.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {data && data.members.length > 0 && (
              <Command.Group
                heading="Members"
                className="mt-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {data.members.map((m) => (
                  <Command.Item
                    key={m._id}
                    value={`member-${m._id}`}
                    onSelect={() => {}}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors aria-selected:bg-primary/10 aria-selected:text-primary"
                  >
                    <UserIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">{m.fullName}</span>{' '}
                    <span className="min-w-0 truncate text-xs text-muted-foreground">({m.email})</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {q.trim().length > 1 && data && data.cards.length === 0 && data.boards.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium">No results found</div>
                <div className="text-xs text-muted-foreground">
                  Nothing matched &ldquo;{q}&rdquo;.
                </div>
              </div>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
