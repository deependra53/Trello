'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Inbox, LayoutGrid, Layers, Settings, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';

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

  return (
    <>
      {/* mobile overlay */}
      {open && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 top-14 z-30 w-64 transform border-r bg-background transition-transform md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <nav className="flex h-full flex-col p-4">
          <div className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Workspace
          </div>
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}

          <div className="mt-6 mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Starred
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <Star className="h-4 w-4" /> No starred boards yet
          </div>
        </nav>
      </aside>
    </>
  );
}
