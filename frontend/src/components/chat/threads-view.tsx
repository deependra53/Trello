'use client';
import { useEffect, useMemo, useRef } from 'react';
import { ArrowUpRight, Menu, MessageSquare } from 'lucide-react';
import { useUserThreads } from '@/hooks/use-chat';
import { channelLabel, formatDayLabel, formatTime, toPlainText } from '@/lib/chat-utils';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import type { ChatMessage, ThreadSummary } from '@/types/api';

/** Time today → "3:42 PM", otherwise → "Yesterday" / "Monday, June 2". */
function smartTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) return formatTime(iso);
  return formatDayLabel(iso);
}

/** The thread's most recent activity timestamp — drives time label + day grouping. */
function threadTs(t: ThreadSummary): string | undefined {
  return t.lastMessages[t.lastMessages.length - 1]?.createdAt ?? t.root.lastReplyAt ?? t.root.createdAt;
}

export function ThreadsView({
  workspaceId,
  activeThreadId,
  onOpenThread,
  onGoToOriginal,
  onOpenRail,
}: {
  workspaceId: string;
  activeThreadId?: string;
  onOpenThread: (channelId: string, root: ChatMessage) => void;
  onGoToOriginal: (channelId: string, messageId: string) => void;
  /** Opens the channel rail drawer on phones (md:hidden trigger). */
  onOpenRail?: () => void;
}) {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useUserThreads(workspaceId);

  // A thread that gets a fresh reply is re-fetched onto page 1 while an older
  // cursor page may still reference it — dedupe by root id so it shows once.
  const threads = useMemo(() => {
    const seen = new Set<string>();
    const out: ThreadSummary[] = [];
    for (const page of data?.pages ?? []) {
      for (const t of page.items) {
        if (seen.has(t.root._id)) continue;
        seen.add(t.root._id);
        out.push(t);
      }
    }
    return out;
  }, [data]);

  // Slice the (already ordered) list into day buckets for the date headers.
  const groups = useMemo(() => {
    const out: { label: string; items: ThreadSummary[] }[] = [];
    for (const t of threads) {
      const label = formatDayLabel(threadTs(t));
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(t);
      else out.push({ label, items: [t] });
    }
    return out;
  }, [threads]);

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threads.length]);

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/60 px-4 pb-4 pt-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          {/* Open the channel rail on phones. */}
          <button
            type="button"
            onClick={onOpenRail}
            aria-label="Open menu"
            className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Threads</h1>
          {threads.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {threads.length}
              {hasNextPage ? '+' : ''}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          All replies from your conversations in one place.
        </p>
      </div>

      {/* List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mb-2 rounded-xl border border-border/60 p-4">
                <div className="flex gap-3">
                  <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1">
                    <div className="skeleton h-3.5 w-48 rounded" />
                    <div className="mt-2 skeleton h-3 w-full rounded" />
                    <div className="mt-1.5 skeleton h-3 w-2/3 rounded" />
                  </div>
                </div>
              </div>
            ))}

          {!isLoading && threads.length === 0 && (
            <div className="animate-fade-up px-4 py-20 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No threads yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Replies you send or start will collect here.
              </p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-1 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((t) => {
                  const isActive = activeThreadId === t.root._id;
                  const isDm = t.channel?.kind === 'dm';
                  const latest = t.lastMessages[t.lastMessages.length - 1];
                  const actorName =
                    latest?.author?.fullName ?? t.root.author?.fullName ?? 'Someone';
                  const action = isDm
                    ? t.mentioned
                      ? 'mentioned you in DM with'
                      : 'replied in DM with'
                    : t.mentioned
                      ? 'mentioned you in'
                      : 'replied in';
                  const headline =
                    toPlainText(t.root.deleted ? 'This message was deleted' : t.root.body || '') ||
                    '(no text)';
                  const showReplyLine = latest && latest._id !== t.root._id;
                  const replyText = latest
                    ? toPlainText(latest.deleted ? 'This message was deleted' : latest.body || '') ||
                      '(no text)'
                    : '';

                  const openThread = () => t.channel && onOpenThread(t.channel._id, t.root);
                  const stop = (e: React.MouseEvent) => e.stopPropagation();

                  return (
                    <div
                      key={t.root._id}
                      role="button"
                      tabIndex={0}
                      onClick={openThread}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openThread();
                        }
                      }}
                      className={cn(
                        'group relative cursor-pointer rounded-xl border bg-card p-4 pl-5 text-left transition-all duration-150 hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                        isActive
                          ? 'border-primary/40 bg-accent/40 shadow-sm'
                          : 'border-border/60',
                      )}
                    >
                      {/* Active / unread accent bar */}
                      {(isActive || t.unread) && (
                        <span
                          className={cn(
                            'absolute inset-y-3 left-0 w-1 rounded-full',
                            isActive ? 'bg-primary' : 'bg-primary/40',
                          )}
                        />
                      )}

                      <div className="flex gap-3">
                        <UserAvatar
                          user={latest?.author ?? t.root.author}
                          id={latest?.authorId ?? t.root.authorId}
                          className="h-10 w-10 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          {/* Row 1: who / where / when */}
                          <div className="flex items-start gap-2">
                            <p className="min-w-0 flex-1 truncate text-sm">
                              <span className="font-semibold text-foreground">{actorName}</span>{' '}
                              <span className="text-muted-foreground">{action}</span>{' '}
                              {t.channel && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    stop(e);
                                    onGoToOriginal(t.channel!._id, t.root._id);
                                  }}
                                  className="font-medium text-primary hover:underline"
                                >
                                  {isDm ? t.channel.name : channelLabel(t.channel)}
                                </button>
                              )}
                            </p>
                            <div className="flex shrink-0 items-center gap-2 pl-1">
                              <span className="text-xs text-muted-foreground">
                                {smartTime(threadTs(t))}
                              </span>
                              {t.unread && (
                                <span
                                  className="h-2 w-2 rounded-full bg-primary"
                                  aria-label="Unread"
                                />
                              )}
                            </div>
                          </div>

                          {/* Row 2: headline message */}
                          <p className="mt-1 truncate text-sm text-foreground/90">“{headline}”</p>

                          {/* Row 3: latest reply preview */}
                          {showReplyLine && (
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                              <span className="font-medium text-foreground/80">
                                {latest?.author?.fullName ?? 'Someone'}
                              </span>{' '}
                              replied: {replyText}
                            </p>
                          )}

                          {/* Row 4: footer */}
                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {t.root.replyCount} {t.root.replyCount === 1 ? 'reply' : 'replies'}
                            </span>

                            {t.participants.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-2">
                                  {t.participants.slice(0, 3).map((p) => (
                                    <UserAvatar
                                      key={p._id}
                                      id={p._id}
                                      name={p.fullName}
                                      avatarUrl={p.avatarUrl}
                                      className="h-5 w-5 rounded-full ring-2 ring-card"
                                    />
                                  ))}
                                  {t.participantCount > 3 && (
                                    <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-card">
                                      +{t.participantCount - 3}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {t.participantCount}{' '}
                                  {t.participantCount === 1 ? 'participant' : 'participants'}
                                </span>
                              </div>
                            )}

                            {t.channel && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  stop(e);
                                  onGoToOriginal(t.channel!._id, t.root._id);
                                }}
                                className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                              >
                                Jump to conversation
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hasNextPage && <div ref={sentinelRef} className="h-1" />}
          {isFetchingNextPage && (
            <p className="py-3 text-center text-xs text-muted-foreground">Loading more…</p>
          )}
        </div>
      </div>
    </div>
  );
}
