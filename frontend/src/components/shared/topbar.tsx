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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 glass px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Link href="/boards" className="flex items-center gap-2.5 font-bold tracking-tight">
        <div className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-primary-foreground shadow-glow">
          <span className="text-base">T</span>
        </div>
        <span className="hidden text-base sm:inline">TrelloX</span>
      </Link>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="ml-auto hidden h-9 w-72 items-center gap-2 rounded-lg border border-border/70 bg-background/50 px-3 text-left text-sm text-muted-foreground transition hover:border-border hover:bg-background md:flex"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate whitespace-nowrap">Search boards, cards, members…</span>
        <kbd className="shrink-0 rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium">
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
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user?.fullName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-semibold">{user?.fullName ?? 'Guest'}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
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
