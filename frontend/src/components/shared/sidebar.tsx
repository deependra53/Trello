'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LayoutGrid, Layers, Settings, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useOrgChatRealtime } from '@/hooks/use-chat-realtime';
import type { Workspace } from '@/types/api';

// Chat lives in its own pane reached via the navbar toggle, so it is deliberately
// NOT a sidebar item — the channel rail replaces this sidebar in chat mode.
const items = [
  { href: '/boards', label: 'Boards', icon: LayoutGrid },
  { href: '/planner', label: 'Planner', icon: Calendar },
  { href: '/templates', label: 'Templates', icon: Layers },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const open = useUIStore((s) => s.sidebarOpen);
  const setOpen = useUIStore((s) => s.setSidebarOpen);

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api<{ items: Workspace[] }>('/api/workspaces').then((r) => r.items),
  });

  // On desktop the sidebar is a persistent panel, so navigating must NOT close it —
  // it stays open until the user collapses it with the chevron. On mobile it's a
  // full-screen overlay sitting over the page, so we still close it after a tap.
  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 768px)').matches) {
      setOpen(false);
    }
  };

  // Keep org chat realtime alive app-wide (unread counts surface in the navbar toggle).
  const primaryOrgId = workspaces?.[0]?._id;
  useOrgChatRealtime(primaryOrgId);

  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-black/60 animate-in fade-in-0 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          'brand-surface fixed inset-y-0 left-0 top-16 z-30 w-64 transform overflow-hidden border border-border/60 shadow-sm transition-[transform,width,margin,opacity,border-color] duration-200 ease-out md:static md:top-auto md:h-full md:translate-x-0 md:rounded-2xl md:shrink-0',
          open
            ? 'translate-x-0 md:w-64 md:opacity-100'
            : '-translate-x-full md:w-0 md:-ml-3 md:border-transparent md:opacity-0 md:shadow-none',
        )}
      >
        <nav className="flex h-full flex-col gap-0.5 overflow-y-auto p-3 scrollbar-thin">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={closeOnMobile}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0',
                  active
                    ? 'bg-primary text-primary-foreground shadow-glow-sm'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="flex-1">{label}</span>
              </Link>
            );
          })}

          <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Organization
          </div>
          {!workspaces ? (
            <div className="space-y-1 px-1">
              <div className="skeleton h-9 w-full rounded-lg" />
              <div className="skeleton h-9 w-full rounded-lg" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No workspaces yet</div>
          ) : (
            workspaces.map((ws) => (
              <Link
                key={ws._id}
                href={`/boards?workspace=${ws._id}`}
                onClick={closeOnMobile}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none transition-all duration-150 hover:bg-primary/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
              >
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md brand-gradient text-[10px] font-bold text-primary-foreground shadow-sm">
                  {ws.name[0]?.toUpperCase()}
                </div>
                <span className="truncate">{ws.name}</span>
              </Link>
            ))
          )}

          <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Starred
          </div>
          <div className="mx-1 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-5 text-center">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Star className="h-4 w-4" />
            </div>
            <span className="text-xs text-muted-foreground">No starred boards yet</span>
          </div>
        </nav>
      </aside>
    </>
  );
}
