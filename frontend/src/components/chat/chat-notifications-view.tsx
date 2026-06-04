'use client';
import { useEffect, useMemo, useRef } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Bell, CheckCheck, Menu } from 'lucide-react';
import { formatDayLabel } from '@/lib/chat-utils';
import { cn } from '@/lib/utils';
import { channelIdFromLink, notificationMeta } from '@/lib/notification-meta';
import {
  useMarkAllRead,
  useMarkRead,
  useNotificationsInfinite,
} from '@/hooks/use-notifications';
import type { Notification } from '@/types/api';

/**
 * The Chat world's own notifications (mentions, channel invites). Lives inside
 * the always-mounted Chat pane as a third view alongside conversations and
 * threads. Board notifications never appear here.
 */
export function ChatNotificationsView({
  onOpenChannel,
  onOpenRail,
}: {
  onOpenChannel: (channelId: string) => void;
  /** Opens the channel rail drawer on phones (md:hidden trigger). */
  onOpenRail?: () => void;
}) {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useNotificationsInfinite('chat');
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead('chat');

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  // Slice the (already newest-first) list into day buckets for headers.
  const groups = useMemo(() => {
    const out: { label: string; items: Notification[] }[] = [];
    for (const n of items) {
      const label = formatDayLabel(n.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [items]);

  // Infinite scroll: load the next page when the sentinel enters the scroll area.
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { root, rootMargin: '200px' },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  function open(n: Notification) {
    if (!n.read) markRead.mutate(n._id);
    const channelId = channelIdFromLink(n.link);
    if (channelId) onOpenChannel(channelId);
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 pb-4 pt-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-2.5">
          {/* Open the channel rail on phones. */}
          <button
            type="button"
            onClick={onOpenRail}
            aria-label="Open menu"
            className="-ml-1 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            {unread > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground shadow-glow-sm">
                {unread}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Mentions and channel invites from your conversations.
          </p>
          </div>
        </div>
        <button
          type="button"
          disabled={unread === 0 || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40"
        >
          <CheckCheck className="h-4 w-4" />{' '}
          <span className="hidden sm:inline">Mark all read</span>
          <span className="sr-only sm:hidden">Mark all read</span>
        </button>
      </div>

      {/* List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="animate-fade-up px-4 py-20 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">You&rsquo;re all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mentions and channel invites will show up here.
            </p>
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="sticky top-0 z-10 border-b border-border/60 bg-background px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h2>
                <ul className="divide-y divide-border/60">
                  {group.items.map((n) => {
                    const { icon: Icon, className } = notificationMeta(n.type);
                    return (
                      <li key={n._id} className="group relative">
                        <button
                          type="button"
                          onClick={() => open(n)}
                          className={cn(
                            'flex w-full items-start gap-3 py-3.5 pl-6 pr-12 text-left transition-colors hover:bg-muted',
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
                        </button>
                        {!n.read && (
                          <button
                            type="button"
                            aria-label="Mark as read"
                            title="Mark as read"
                            onClick={() => markRead.mutate(n._id)}
                            className="absolute right-4 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground opacity-0 outline-none transition-all hover:bg-background hover:text-primary focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40 group-hover:opacity-100"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {hasNextPage && <div ref={sentinelRef} className="h-1" />}
            {isFetchingNextPage && (
              <div className="py-4 text-center text-xs text-muted-foreground">Loading…</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
