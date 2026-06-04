'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { notificationMeta } from '@/lib/notification-meta';
import {
  useMarkAllRead,
  useMarkRead,
  useNotificationsInfinite,
} from '@/hooks/use-notifications';
import type { Notification } from '@/types/api';

type Filter = 'all' | 'unread';

function sectionOf(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return 'Earlier';
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  // Boards world: only board notifications. Chat notifications live in the Chat
  // pane's own Notifications view.
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useNotificationsInfinite('boards');
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead('boards');

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );
  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const visible = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter],
  );

  // Group the visible feed into Today / Yesterday / Earlier, preserving order.
  const groups = useMemo(() => {
    const out: { label: string; items: Notification[] }[] = [];
    for (const n of visible) {
      const label = sectionOf(n.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [visible]);

  return (
    <main className="container max-w-2xl py-8 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Notifications</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Card comments, board invites and automations — everything from your boards.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0 || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="mt-5 flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            aria-pressed={filter === t.key}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40',
              filter === t.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="grid place-items-center px-6 py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-sm font-medium">
              {filter === 'unread' ? 'No unread notifications' : "You're all caught up"}
            </h2>
            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
              {filter === 'unread'
                ? 'Switch to “All” to see everything you’ve already read.'
                : "New activity on cards you watch or boards you're a member of will show up here."}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label}>
              <h2 className="sticky top-0 z-10 border-b border-border/60 bg-card px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h2>
              <ul className="divide-y divide-border/60">
                {group.items.map((n) => {
                  const { icon: Icon, className } = notificationMeta(n.type);
                  return (
                    <li key={n._id} className="group relative">
                      <Link
                        href={n.link ?? '#'}
                        onClick={() => !n.read && markRead.mutate(n._id)}
                        className={cn(
                          'flex items-start gap-3 py-3.5 pl-4 pr-12 transition-colors hover:bg-muted',
                          !n.read && 'bg-primary/[0.06]',
                        )}
                      >
                        {!n.read && (
                          <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />
                        )}
                        <div className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full', className)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={cn('text-sm', n.read ? 'font-medium' : 'font-semibold')}>
                            {n.title}
                          </div>
                          {n.body && (
                            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
                          )}
                          <div className="mt-1 text-[10px] font-medium text-muted-foreground">
                            {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </Link>
                      {!n.read && (
                        <button
                          type="button"
                          aria-label="Mark as read"
                          title="Mark as read"
                          onClick={() => markRead.mutate(n._id)}
                          className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground opacity-0 outline-none transition-all hover:bg-background hover:text-primary focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40 group-hover:opacity-100"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {!n.read && (
                        <span className="pointer-events-none absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-glow-sm transition-opacity group-hover:opacity-0" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      {!isLoading && hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </main>
  );
}
