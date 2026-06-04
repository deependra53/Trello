'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Hash,
  Lock,
  LogOut,
  Menu,
  MoreVertical,
  Pin,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  useChannel,
  useJoinChannel,
  useLeaveChannel,
  useMarkRead,
  useMessages,
} from '@/hooks/use-chat';
import { useChannelRealtime } from '@/hooks/use-chat-realtime';
import { formatDayLabel, groupMessages } from '@/lib/chat-utils';
import { MessageItem } from './message-item';
import { MessageListSkeleton } from './message-skeleton';
import { Composer } from './composer';
import { AddMembersDialog, MembersDialog } from './chat-dialogs';
import { UserAvatar } from './user-avatar';
import { ConversationWelcome } from './conversation-welcome';
import type { ChatMessage, OrgMember } from '@/types/api';

export function Conversation({
  workspaceId,
  channelId,
  members,
  currentUserId,
  onOpenThread,
  onTogglePins,
  onToggleSearch,
  focusMessageId,
  onFocusHandled,
  onOpenRail,
}: {
  workspaceId: string;
  channelId: string;
  members: OrgMember[];
  currentUserId: string;
  onOpenThread: (m: ChatMessage) => void;
  onTogglePins: () => void;
  onToggleSearch: () => void;
  focusMessageId?: string;
  onFocusHandled?: () => void;
  /** Opens the channel rail drawer on phones (md:hidden trigger). */
  onOpenRail?: () => void;
}) {
  const { data: channel } = useChannel(channelId);
  const {
    data: messagePages,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(channelId);
  const { typingUserIds } = useChannelRealtime(channelId);
  const markRead = useMarkRead();
  const join = useJoinChannel(workspaceId);
  const leave = useLeaveChannel(workspaceId);
  const [addOpen, setAddOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  // The id of a message to briefly flash after a "jump to message" navigation.
  const [flashId, setFlashId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  // Whether we should keep the view pinned to the newest message. True on open;
  // becomes false if the user scrolls up to read history, true again at bottom.
  const stickToBottom = useRef(true);
  // Viewport scroll metrics captured right before older history is paged in, so
  // we can restore the user's reading position once the taller list has rendered.
  const prependAnchor = useRef<{ height: number; top: number } | null>(null);

  // Flatten pages oldest→newest. pages[0] is the newest page (older pages are
  // appended at the end), and each page's items are already ascending.
  const items = useMemo(
    () => (messagePages ? [...messagePages.pages].reverse().flatMap((p) => p.items) : []),
    [messagePages],
  );
  const count = items.length;
  // Identity of the newest message — changes when a message arrives at the
  // bottom, but NOT when older history is prepended above.
  const lastMessageId = count > 0 ? items[count - 1]!._id : undefined;

  function getViewport(): HTMLElement | null {
    return (
      scrollRootRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]') ?? null
    );
  }
  function scrollToBottom() {
    const vp = getViewport();
    if (vp) vp.scrollTop = vp.scrollHeight;
  }
  // Move the cursor into the message composer (scoped to this conversation so we
  // never grab a thread-panel composer). Used by the empty-state quick actions.
  function focusComposer() {
    containerRef.current?.querySelector<HTMLElement>('.tiptap-composer .ProseMirror')?.focus();
  }

  // Mark the channel read on open and when a newer message arrives — but not
  // when older history is paged in above (that doesn't change lastMessageId).
  useEffect(() => {
    if (channelId) markRead.mutate(channelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, lastMessageId]);

  // Open every channel at the newest message (bottom), not the oldest.
  useEffect(() => {
    stickToBottom.current = true;
    requestAnimationFrame(scrollToBottom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Follow new (bottom) messages only while the user is already at the bottom —
  // never while a "jump to message" is pending (let focus win), and never on
  // older-history loads (lastMessageId is unchanged then).
  useEffect(() => {
    if (stickToBottom.current && !focusMessageId) requestAnimationFrame(scrollToBottom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessageId]);

  // Older history paged in at the top adds height above the viewport; restore the
  // scroll position so the user stays on the message they were reading rather than
  // being jumped down. Runs before paint to avoid a visible flicker.
  useLayoutEffect(() => {
    const vp = getViewport();
    if (vp && prependAnchor.current) {
      // Set (not increment) so we're immune to any scrollTop the browser's own
      // scroll-anchoring may have applied while the older page was loading.
      vp.scrollTop = prependAnchor.current.top + (vp.scrollHeight - prependAnchor.current.height);
      prependAnchor.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Late-loading attachment images change the height — re-pin to bottom as they
  // load (this is why the view previously stopped short of the newest message).
  useEffect(() => {
    const vp = getViewport();
    if (!vp) return;
    const imgs = Array.from(vp.querySelectorAll('img')).filter((img) => !img.complete);
    if (!imgs.length) return;
    const onLoad = () => {
      if (stickToBottom.current) scrollToBottom();
    };
    imgs.forEach((img) => img.addEventListener('load', onLoad));
    return () => imgs.forEach((img) => img.removeEventListener('load', onLoad));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, count]);

  // Track bottom-stickiness (so we don't yank the user while they read), and page
  // in older history once they scroll near the top.
  useEffect(() => {
    const vp = getViewport();
    if (!vp) return;
    const onScroll = () => {
      stickToBottom.current = vp.scrollHeight - vp.scrollTop - vp.clientHeight < 120;
      if (vp.scrollTop < 120 && hasNextPage && !isFetchingNextPage) {
        // Capture position before the list grows so we can restore it after.
        prependAnchor.current = { height: vp.scrollHeight, top: vp.scrollTop };
        fetchNextPage();
      }
    };
    vp.addEventListener('scroll', onScroll, { passive: true });
    return () => vp.removeEventListener('scroll', onScroll);
  }, [channelId, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // "Go to original message": scroll the requested message into view and flash it.
  // This chat only loads the latest page, so a message older than the loaded
  // window can't be focused — we say so instead. We clear the parent's focus right
  // away (one-shot); the flash auto-clears via its own effect below so this run's
  // teardown can't cancel it.
  useEffect(() => {
    if (!focusMessageId || count === 0) return;
    const el = getViewport()?.querySelector<HTMLElement>(
      `[data-message-id="${focusMessageId}"]`,
    );
    if (el) {
      stickToBottom.current = false;
      requestAnimationFrame(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      setFlashId(focusMessageId);
    } else {
      toast.message('This message is older than the ones loaded here.');
    }
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMessageId, count]);

  // Fade the jump highlight after a moment, independent of the focus lifecycle.
  useEffect(() => {
    if (!flashId) return;
    const timer = setTimeout(() => setFlashId(null), 2200);
    return () => clearTimeout(timer);
  }, [flashId]);

  const isDm = channel?.kind === 'dm';
  const others = useMemo(
    () => (channel?.members ?? []).filter((m) => m.userId !== currentUserId),
    [channel, currentUserId],
  );
  const title = isDm
    ? others.map((o) => o.profile?.fullName).filter(Boolean).join(', ') || 'Direct message'
    : channel?.name ?? '';

  const groups = useMemo(() => groupMessages(items), [items]);
  const typingNames = typingUserIds
    .filter((id) => id !== currentUserId)
    .map((id) => members.find((m) => m.userId === id)?.profile?.fullName?.split(' ')[0])
    .filter(Boolean);

  let lastDay = '';

  return (
    <div ref={containerRef} className="flex h-full min-w-0 flex-1 flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-4 py-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          {/* Open the channel rail on phones. */}
          <button
            type="button"
            onClick={onOpenRail}
            aria-label="Open menu"
            className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          {isDm ? (
            <>
              <UserAvatar user={others[0]?.profile} id={others[0]?.userId} className="h-8 w-8" />
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold tracking-tight">{title}</h2>
                {channel?.topic && (
                  <p className="truncate text-xs text-muted-foreground">{channel.topic}</p>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => setMembersOpen(true)}
              className="group/title -ml-1.5 flex min-w-0 items-center rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              title="Channel details"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {channel?.isPrivate ? (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <h2 className="truncate text-[15px] font-semibold tracking-tight">{title}</h2>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover/title:translate-y-px" />
                </div>
                {channel?.topic && (
                  <p className="truncate text-xs text-muted-foreground">{channel.topic}</p>
                )}
              </div>
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {!isDm && (
            <button
              onClick={() => setMembersOpen(true)}
              className="mr-1 flex items-center gap-1.5 rounded-lg border border-border/60 px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              title="View members"
            >
              <Users className="h-3.5 w-3.5" />
              {channel?.members.length ?? 0}
            </button>
          )}
          <button
            onClick={onTogglePins}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            title="Pinned messages"
          >
            <Pin className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleSearch}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          {!isDm && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-lg">
                <DropdownMenuItem onClick={() => setAddOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  View members
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() =>
                    leave.mutate(channelId, {
                      onSuccess: () => toast.success(`Left #${channel?.name}`),
                    })
                  }
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave channel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Not-a-member banner for public channels */}
      {channel && !channel.isMember && !isDm && (
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-primary/5 px-4 py-2.5 text-sm">
          <span className="min-w-0 truncate text-muted-foreground">You’re previewing #{channel.name}.</span>
          <button
            onClick={() => join.mutate(channelId)}
            className="shrink-0 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Join channel
          </button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRootRef} className="flex-1">
        <div className="py-3">
          {messagesLoading ? (
            <MessageListSkeleton />
          ) : (
            <>
              {/* Spinner while older history pages in at the top. */}
              {isFetchingNextPage && (
                <div className="flex justify-center py-3" aria-hidden>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                </div>
              )}
              {/* Only the genuinely-empty channel shows the welcome — not a loading
                  one, and only once the channel detail is in (so isDm/name are
                  accurate and we never flash "Welcome to #"). */}
              {count === 0 && channel && (
                <ConversationWelcome
                  isDm={isDm}
                  channelName={channel?.name}
                  decorMembers={(channel?.members ?? []).slice(0, 2)}
                  onSendMessage={focusComposer}
                  onShareIdeas={focusComposer}
                />
              )}
              {groups.map((group) => {
                const day = formatDayLabel(group[0]?.createdAt);
                const showDay = day !== lastDay;
                lastDay = day;
                return (
                  <div key={group[0]?._id}>
                    {showDay && (
                      <div className="my-3 flex items-center gap-3 px-4">
                        <span className="h-px flex-1 bg-border/60" />
                        <span className="rounded-full border border-border/60 bg-background px-3 py-0.5 text-[11px] font-semibold text-muted-foreground shadow-xs">
                          {day}
                        </span>
                        <span className="h-px flex-1 bg-border/60" />
                      </div>
                    )}
                    {group.map((m, i) => (
                      <MessageItem
                        key={m._id}
                        message={m}
                        channelId={channelId}
                        currentUserId={currentUserId}
                        workspaceId={workspaceId}
                        grouped={i > 0}
                        onOpenThread={onOpenThread}
                        highlight={flashId === m._id}
                      />
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      <div className="h-5 px-5 text-xs text-muted-foreground">
        {typingNames.length > 0 && (
          <span className="flex animate-fade-in items-center gap-1.5">
            <span className="animate-pulse">
              {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
            </span>
          </span>
        )}
      </div>

      <Composer channelId={channelId} members={members} />

      {channel && (
        <>
          <AddMembersDialog
            workspaceId={workspaceId}
            channelId={channelId}
            members={members}
            existingIds={channel.members.map((m) => m.userId)}
            open={addOpen}
            onOpenChange={setAddOpen}
          />
          <MembersDialog
            members={channel.members}
            channelName={channel.name}
            currentUserId={currentUserId}
            open={membersOpen}
            onOpenChange={setMembersOpen}
          />
        </>
      )}
    </div>
  );
}
