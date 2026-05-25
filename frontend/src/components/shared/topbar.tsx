'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Search, Settings, User as UserIcon } from 'lucide-react';
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Link href="/boards" className="flex items-center gap-2 font-bold">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          T
        </div>
        <span className="hidden sm:inline">TrelloX</span>
      </Link>

      <Button
        variant="outline"
        size="sm"
        className="ml-auto hidden gap-2 md:flex"
        onClick={() => setCommandOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="text-muted-foreground">Search…</span>
        <kbd className="ml-4 text-xs text-muted-foreground">⌘K</kbd>
      </Button>

      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCommandOpen(true)} aria-label="Search">
        <Search className="h-5 w-5" />
      </Button>

      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </Button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Profile">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.fullName ?? 'Guest'}</span>
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
