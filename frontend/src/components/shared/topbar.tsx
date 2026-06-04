'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, Search, Settings, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './theme-toggle';
import { NotificationsDropdown } from './notifications-dropdown';
import { WorkspaceToggle } from './workspace-toggle';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { getInitials } from '@/lib/utils';

export function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 glass px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Link
        href="/boards"
        className="flex items-center gap-2.5 rounded-lg font-bold tracking-tight outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-primary-foreground shadow-glow-sm transition-shadow hover:shadow-glow">
          <span className="text-base font-bold">I</span>
        </div>
        <span className="hidden text-base sm:inline">IndiHive</span>
      </Link>

      <WorkspaceToggle />

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group ml-auto hidden h-9 w-72 items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 text-left text-sm text-muted-foreground outline-none transition-all duration-150 hover:border-border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 md:flex"
      >
        <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-foreground" />
        <span className="flex-1 truncate whitespace-nowrap">Search boards, cards, members…</span>
        <kbd className="shrink-0 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto md:hidden"
        onClick={() => setCommandOpen(true)}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      <NotificationsDropdown />

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Profile">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(user?.fullName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 rounded-xl shadow-lg">
          <DropdownMenuLabel className="px-2 py-2">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{user?.fullName ?? 'Guest'}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push('/settings')}>
            <UserIcon className="mr-2 h-4 w-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={async () => {
              await logout();
              router.push('/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
