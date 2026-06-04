'use client';
import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { channelIdFromLink, notificationMeta } from '@/lib/notification-meta';
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '@/hooks/use-notifications';
import { useWorkspaceSection } from '@/hooks/use-workspace-section';
import { useUIStore } from '@/stores/ui';
import type { Notification } from '@/types/api';

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  // The bell follows whichever world you're in: Boards notifications while on
  // Boards, Chat notifications while on Chat. The two never mix.
  const { section } = useWorkspaceSection();
  const scope = section === 'chat' ? 'chat' : 'boards';
  const setChatNavTarget = useUIStore((s) => s.setChatNavTarget);

  const { data: notifications } = useNotifications(scope);
  const { data: unreadCount = 0 } = useUnreadCount(scope);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead(scope);

  function onRowClick(n: Notification) {
    if (!n.read) markRead.mutate(n._id);
    setOpen(false);
    // Chat rows live in the always-mounted pane, not a Next route — jump there
    // via the pane's nav signal instead of a real navigation.
    if (scope === 'chat') {
      const channelId = channelIdFromLink(n.link);
      if (channelId) setChatNavTarget({ view: 'channel', channelId });
    }
  }

  function onViewAll() {
    setOpen(false);
    if (scope === 'chat') setChatNavTarget({ view: 'notifications' });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-glow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl p-0 shadow-lg">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">
            {scope === 'chat' ? 'Chat notifications' : 'Board notifications'}
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0 bg-border/60" />
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">You&rsquo;re all caught up</div>
              <div className="text-xs text-muted-foreground">
                {scope === 'chat' ? 'No new chat activity.' : 'No new board activity.'}
              </div>
            </div>
          ) : (
            notifications.slice(0, 12).map((n) => {
              const { icon: Icon, className } = notificationMeta(n.type);
              const inner = (
                <>
                  <div className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full', className)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{n.title}</div>
                    {n.body && (
                      <div className="line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </>
              );
              const rowClass = cn(
                'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left outline-none transition-colors last:border-b-0 hover:bg-muted focus-visible:bg-muted',
                !n.read && 'bg-primary/[0.06]',
              );
              // Boards rows are real routes (Link); chat rows drive the pane.
              return scope === 'chat' ? (
                <button key={n._id} type="button" onClick={() => onRowClick(n)} className={rowClass}>
                  {inner}
                </button>
              ) : (
                <Link key={n._id} href={n.link ?? '#'} onClick={() => onRowClick(n)} className={rowClass}>
                  {inner}
                </Link>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="m-0 bg-border/60" />
        <div className="p-2">
          {scope === 'chat' ? (
            <Button variant="ghost" size="sm" className="w-full" onClick={onViewAll}>
              View all notifications
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/notifications" onClick={onViewAll}>
                View all notifications
              </Link>
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
