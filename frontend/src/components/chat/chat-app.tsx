'use client';
import { useEffect, useState } from 'react';
import { Building2, Menu, MessageSquare } from 'lucide-react';
import { useWorkspaces } from '@/hooks/use-boards';
import { useAuthStore } from '@/stores/auth';
import { useChannels, useChatBootstrap, useDms, useOrgMembers } from '@/hooks/use-chat';
import { useOrgChatRealtime } from '@/hooks/use-chat-realtime';
import { ChannelRail } from './channel-rail';
import { Conversation } from './conversation';
import { ThreadPanel } from './thread-panel';
import { ThreadsView } from './threads-view';
import { ChatNotificationsView } from './chat-notifications-view';
import { PinsPanel, SearchPanel } from './side-panels';
import { CreateChannelDialog, InvitePeopleDialog, StartDmDialog } from './chat-dialogs';
import { useUIStore } from '@/stores/ui';
import { useUnreadCount } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/api';

type RightPanel =
  | { kind: 'thread'; channelId: string; parent: ChatMessage }
  | { kind: 'pins' }
  | { kind: 'search' }
  | null;

export function ChatApp({ initialChannelId }: { initialChannelId?: string }) {
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?._id ?? user?.id ?? '';
  const { data: orgs } = useWorkspaces();

  const [activeOrgId, setActiveOrgId] = useState<string | undefined>();
  const [activeChannelId, setActiveChannelId] = useState<string | undefined>(initialChannelId);
  const [view, setView] = useState<'conversation' | 'threads' | 'notifications'>('conversation');
  const [right, setRight] = useState<RightPanel>(null);
  // UI-only: on phones the channel rail is a slide-in drawer (no effect at md+).
  const [railOpen, setRailOpen] = useState(false);

  // Unread chat notifications power the rail's Notifications entry badge.
  const { data: notifUnread = 0 } = useUnreadCount('chat');

  // The topbar bell drives this pane from outside via a one-shot store signal.
  const chatNavTarget = useUIStore((s) => s.chatNavTarget);
  const setChatNavTarget = useUIStore((s) => s.setChatNavTarget);
  // A message to jump to + flash after "Go to original message".
  const [focus, setFocus] = useState<{ channelId: string; messageId: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [dmOpen, setDmOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Default to the user's first organization.
  useEffect(() => {
    if (!activeOrgId && orgs && orgs.length > 0) setActiveOrgId(orgs[0]?._id);
  }, [orgs, activeOrgId]);

  useOrgChatRealtime(activeOrgId);
  // Prefetch each conversation's latest messages on open so channels render
  // instantly instead of flashing the empty state while their page loads.
  useChatBootstrap(activeOrgId);
  const { data: members } = useOrgMembers(activeOrgId);
  const { data: channels } = useChannels(activeOrgId);
  const { data: dms } = useDms(activeOrgId);

  const activeOrg = orgs?.find((o) => o._id === activeOrgId);
  // Only org owners/admins may invite people to the organization.
  const myOrgRole = members?.find((m) => m.userId === currentUserId)?.role;
  const canInvite = myOrgRole === 'owner' || myOrgRole === 'admin';

  // Pick a sensible default conversation once data is available.
  useEffect(() => {
    if (activeChannelId) return;
    const first = channels?.[0]?._id ?? dms?.[0]?._id;
    if (first) setActiveChannelId(first);
  }, [channels, dms, activeChannelId]);

  function selectChannel(id: string) {
    setActiveChannelId(id);
    setView('conversation');
    setRight(null);
    setFocus(null);
    setRailOpen(false);
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `/chat/${id}`);
  }

  function openThreads() {
    setView('threads');
    setRight(null);
    setFocus(null);
    setRailOpen(false);
  }

  function openNotifications() {
    setView('notifications');
    setRight(null);
    setFocus(null);
    setRailOpen(false);
  }

  // Consume one-shot nav requests from the topbar bell: open the notifications
  // view, or jump straight to a channel.
  useEffect(() => {
    if (!chatNavTarget) return;
    if (chatNavTarget.view === 'notifications') openNotifications();
    else selectChannel(chatNavTarget.channelId);
    setChatNavTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatNavTarget]);

  // Jump from a thread to its source message inside the channel.
  function goToOriginal(channelId: string, messageId: string) {
    setActiveChannelId(channelId);
    setView('conversation');
    setRight(null);
    setFocus({ channelId, messageId });
    if (typeof window !== 'undefined') window.history.replaceState(null, '', `/chat/${channelId}`);
  }

  function switchOrg(id: string) {
    setActiveOrgId(id);
    setActiveChannelId(undefined);
    setView('conversation');
    setRight(null);
    setFocus(null);
  }

  if (!orgs) {
    return (
      <div className="flex h-full">
        <div className="hidden w-60 shrink-0 flex-col gap-2 border-r border-border/60 bg-muted/30 p-3 sm:flex">
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="mt-3 h-3 w-20 rounded skeleton" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-7 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
        </div>
      </div>
    );
  }
  if (orgs.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div className="animate-fade-up">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">No organizations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You’re not part of any organization yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full overflow-hidden">
      {activeOrgId && (
        <>
          {/* Scrim behind the channel-rail drawer (phones only). */}
          {railOpen && (
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setRailOpen(false)}
              className="absolute inset-0 z-30 bg-black/50 md:hidden"
            />
          )}
          <div
            className={cn(
              'absolute inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:shrink-0 md:transition-none',
              railOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <ChannelRail
              orgs={orgs}
              activeOrgId={activeOrgId}
              onSwitchOrg={switchOrg}
              channels={channels ?? []}
              dms={dms ?? []}
              activeChannelId={view === 'conversation' ? activeChannelId : undefined}
              view={view}
              onSelect={selectChannel}
              onOpenThreads={openThreads}
              onOpenNotifications={openNotifications}
              notifUnread={notifUnread}
              onCreateChannel={() => setCreateOpen(true)}
              onStartDm={() => setDmOpen(true)}
              onInvitePeople={() => setInviteOpen(true)}
              canInvite={canInvite}
            />
          </div>
        </>
      )}

      {view === 'notifications' ? (
        <ChatNotificationsView onOpenChannel={selectChannel} onOpenRail={() => setRailOpen(true)} />
      ) : view === 'threads' && activeOrgId ? (
        <ThreadsView
          workspaceId={activeOrgId}
          activeThreadId={right?.kind === 'thread' ? right.parent._id : undefined}
          onOpenThread={(cid, m) => setRight({ kind: 'thread', channelId: cid, parent: m })}
          onGoToOriginal={goToOriginal}
          onOpenRail={() => setRailOpen(true)}
        />
      ) : activeChannelId && activeOrgId ? (
        <Conversation
          key={activeChannelId}
          workspaceId={activeOrgId}
          channelId={activeChannelId}
          members={members ?? []}
          currentUserId={currentUserId}
          onOpenThread={(m) => setRight({ kind: 'thread', channelId: activeChannelId, parent: m })}
          onTogglePins={() => setRight((r) => (r?.kind === 'pins' ? null : { kind: 'pins' }))}
          onToggleSearch={() => setRight((r) => (r?.kind === 'search' ? null : { kind: 'search' }))}
          focusMessageId={focus && focus.channelId === activeChannelId ? focus.messageId : undefined}
          onFocusHandled={() => setFocus(null)}
          onOpenRail={() => setRailOpen(true)}
        />
      ) : (
        <div className="relative grid flex-1 place-items-center bg-background p-6 text-center">
          {/* Open the channel rail on phones from the empty state. */}
          <button
            type="button"
            onClick={() => setRailOpen(true)}
            aria-label="Open menu"
            className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="animate-fade-up">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary shadow-glow-sm">
              <MessageSquare className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a channel or start a direct message.
            </p>
          </div>
        </div>
      )}

      {/* Right panel — a static column at lg+, an overlay drawer below it. */}
      {right && activeOrgId && (
        <>
          {/* Tap-to-close scrim behind the drawer (below lg only). */}
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setRight(null)}
            className="absolute inset-0 z-30 bg-black/50 lg:hidden"
          />
          <div className="absolute inset-y-0 right-0 z-40 w-full max-w-md animate-slide-in-right shadow-2xl lg:static lg:z-auto lg:w-96 lg:max-w-none lg:shrink-0 lg:shadow-none">
            {right.kind === 'thread' && (
              <ThreadPanel
                channelId={right.channelId}
                parentId={right.parent._id}
                members={members ?? []}
                currentUserId={currentUserId}
                workspaceId={activeOrgId}
                onClose={() => setRight(null)}
                onGoToOriginal={goToOriginal}
              />
            )}
            {right.kind === 'pins' && activeChannelId && (
              <PinsPanel
                channelId={activeChannelId}
                currentUserId={currentUserId}
                onClose={() => setRight(null)}
              />
            )}
            {right.kind === 'search' && (
              <SearchPanel
                workspaceId={activeOrgId}
                onClose={() => setRight(null)}
                onJump={(cid) => selectChannel(cid)}
              />
            )}
          </div>
        </>
      )}

      {activeOrgId && (
        <>
          <CreateChannelDialog
            workspaceId={activeOrgId}
            members={members ?? []}
            currentUserId={currentUserId}
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={selectChannel}
          />
          <StartDmDialog
            workspaceId={activeOrgId}
            members={members ?? []}
            currentUserId={currentUserId}
            open={dmOpen}
            onOpenChange={setDmOpen}
            onCreated={selectChannel}
          />
          {canInvite && (
            <InvitePeopleDialog
              workspaceId={activeOrgId}
              orgName={activeOrg?.name ?? 'your organization'}
              open={inviteOpen}
              onOpenChange={setInviteOpen}
            />
          )}
        </>
      )}
    </div>
  );
}
