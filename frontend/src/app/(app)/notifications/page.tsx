'use client';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/hooks/use-notifications';

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  return (
    <main className="container max-w-2xl py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mentions, due-soon alerts, board invites — all in one place.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
          <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
        </Button>
      </div>

      <div className="mt-6 divide-y overflow-hidden rounded-xl border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="grid place-items-center px-6 py-20 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white shadow-glow">
              <Bell className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">You&apos;re all caught up</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              New activity on cards you watch or boards you&apos;re a member of will show up here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n._id}
              href={n.link ?? '#'}
              onClick={() => !n.read && markRead.mutate(n._id)}
              className={cn(
                'flex items-start gap-3 px-4 py-3 transition hover:bg-accent/40',
                !n.read && 'bg-accent/20',
              )}
            >
              <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                </div>
              </div>
              {!n.read && <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
