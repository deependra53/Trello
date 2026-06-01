'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Inbox, LayoutGrid, Layers, Settings, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Workspace } from '@/types/api';

const items = [
  { href: '/boards', label: 'Boards', icon: LayoutGrid },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
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

  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 top-16 z-30 w-64 transform overflow-hidden border border-border/60 bg-background shadow-soft transition-[transform,width,margin,opacity,border-color] duration-200 ease-out md:static md:top-auto md:h-full md:translate-x-0 md:rounded-2xl md:shrink-0',
          open
            ? 'translate-x-0 md:w-64 md:opacity-100'
            : '-translate-x-full md:w-0 md:-ml-3 md:border-transparent md:opacity-0 md:shadow-none',
        )}
      >
        <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3 scrollbar-thin">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    active && 'text-primary',
                  )}
                />
                {label}
              </Link>
            );
          })}

          <div className="mt-6 mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspaces
          </div>
          {!workspaces ? (
            <div className="px-3 text-xs text-muted-foreground">Loading…</div>
          ) : workspaces.length === 0 ? (
            <div className="px-3 text-xs text-muted-foreground">No workspaces yet</div>
          ) : (
            workspaces.map((ws) => (
              <Link
                key={ws._id}
                href={`/boards?workspace=${ws._id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <div className="grid h-6 w-6 place-items-center rounded-md brand-gradient text-[10px] font-bold text-primary-foreground">
                  {ws.name[0]?.toUpperCase()}
                </div>
                <span className="truncate">{ws.name}</span>
              </Link>
            ))
          )}

          <div className="mt-6 mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Starred
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5" /> No starred boards yet
          </div>
        </nav>
      </aside>
    </>
  );
}
