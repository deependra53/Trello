'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, joinChannel, leaveChannel } from '@/lib/socket';
import { appendMessageToCache, patchMessageInCaches, reconcileChannelMessages } from './use-chat';
import type { ChatMessage } from '@/types/api';

// How often to reconcile the open channel against the server while the tab is
// visible — a lightweight backstop so a missed socket event can't leave the view
// permanently out of sync with the DB.
const RECONCILE_INTERVAL_MS = 30_000;

/**
 * Subscribes to a channel's realtime room: invalidates the message/thread/pin
 * caches on incoming events and exposes the set of users currently typing.
 */
export function useChannelRealtime(channelId: string | undefined) {
  const qc = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();
    joinChannel(channelId);

    // Pull anything we missed (e.g. a stale cache just restored from IndexedDB,
    // or a message that arrived while we were out of the channel room). Coalesced
    // on a short trailing delay so a burst of triggers — or a chat.activity that
    // races the in-room message.new for the same message — costs one fetch, not
    // many. message.new still appends instantly; this only fills genuine gaps.
    let reconcileTimer: ReturnType<typeof setTimeout> | null = null;
    const reconcile = () => {
      if (reconcileTimer) return;
      reconcileTimer = setTimeout(() => {
        reconcileTimer = null;
        void reconcileChannelMessages(qc, channelId);
      }, 800);
    };
    reconcile();

    // On (re)connect the server gives us back the user/org rooms but NOT the
    // channel room, so we must rejoin and catch up. Fires on reconnect only
    // (the initial connect already joined above).
    const onConnect = () => {
      joinChannel(channelId);
      reconcile();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') reconcile();
    };
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') reconcile();
    }, RECONCILE_INTERVAL_MS);
    socket.on('connect', onConnect);
    document.addEventListener('visibilitychange', onVisible);

    const invalidateMessages = () => {
      qc.invalidateQueries({ queryKey: ['messages', channelId] });
    };
    // A new message is appended to the cache rather than invalidated: refetching
    // an infinite query reloads every page and can drop messages at the (now
    // shifted) newest-page boundary while the user is scrolled up. Thread replies
    // add no top-level message, so a plain refetch is safe (and updates replyCount).
    const onNew = (e: { payload?: { message?: ChatMessage } }) => {
      const msg = e.payload?.message;
      if (!msg) {
        qc.invalidateQueries({ queryKey: ['messages', channelId] });
        return;
      }
      if (msg.parentId) {
        qc.invalidateQueries({ queryKey: ['messages', channelId] });
        qc.invalidateQueries({ queryKey: ['replies', msg.parentId] });
        return;
      }
      appendMessageToCache(qc, channelId, msg);
    };
    // Patch the reactions in place from the echoed message (no invalidate, so it
    // lands smoothly and doesn't refetch the infinite query). The echo carries the
    // full message; we apply its authoritative reactions wherever it's cached.
    const onReaction = (e: { payload?: { message?: ChatMessage } }) => {
      const msg = e.payload?.message;
      if (!msg?._id) return;
      patchMessageInCaches(qc, channelId, msg._id, (m) => ({ ...m, reactions: msg.reactions ?? [] }));
    };
    const onPinned = () => {
      qc.invalidateQueries({ queryKey: ['messages', channelId] });
      qc.invalidateQueries({ queryKey: ['pins', channelId] });
    };
    const onTyping = (e: { userId?: string }) => {
      if (!e.userId) return;
      setTypingUsers((prev) => ({ ...prev, [e.userId as string]: Date.now() }));
    };
    // Reliable backstop for the channel room: `chat.activity` is delivered to the
    // user's OWN room (`user:{id}`), which the server re-joins on every reconnect —
    // unlike channel rooms. So even if we briefly fell out of the channel room and
    // missed its `message.new`, this still tells us a message landed here; reconcile
    // immediately instead of waiting for the periodic sweep. reconcile() dedupes,
    // so this is harmless when message.new already delivered the same message.
    const onActivity = (e: { payload?: { channelId?: string } }) => {
      if (e?.payload?.channelId === channelId) reconcile();
    };

    socket.on('message.new', onNew);
    socket.on('message.updated', invalidateMessages);
    socket.on('message.deleted', invalidateMessages);
    socket.on('message.reaction', onReaction);
    socket.on('message.pinned', onPinned);
    socket.on('channel.typing', onTyping);
    socket.on('chat.activity', onActivity);

    return () => {
      socket.off('message.new', onNew);
      socket.off('message.updated', invalidateMessages);
      socket.off('message.deleted', invalidateMessages);
      socket.off('message.reaction', onReaction);
      socket.off('message.pinned', onPinned);
      socket.off('channel.typing', onTyping);
      socket.off('chat.activity', onActivity);
      socket.off('connect', onConnect);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
      if (reconcileTimer) clearTimeout(reconcileTimer);
      leaveChannel(channelId);
      setTypingUsers({});
    };
  }, [channelId, qc]);

  // Expire typing indicators after 4s of silence.
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        let changed = false;
        for (const [id, ts] of Object.entries(prev)) {
          if (now - ts < 4000) next[id] = ts;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return { typingUserIds: Object.keys(typingUsers) };
}

/**
 * Org-wide chat signals (new public channels, unread bumps, new DMs) so the
 * sidebar/rail stay fresh even when the relevant channel isn't open.
 */
export function useOrgChatRealtime(workspaceId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!workspaceId) return;
    const socket = getSocket();
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['channels', workspaceId] });
      qc.invalidateQueries({ queryKey: ['dms', workspaceId] });
      qc.invalidateQueries({ queryKey: ['chat-unread', workspaceId] });
      // chat.activity fires for any new message (incl. thread replies) in my
      // channels, so the threads inbox bubbles live when others reply.
      qc.invalidateQueries({ queryKey: ['user-threads', workspaceId] });
    };
    const events = [
      'channel.created',
      'channel.updated',
      'dm.created',
      'chat.activity',
      'chat.read',
      'channel.left',
    ];
    events.forEach((e) => socket.on(e, refresh));
    return () => events.forEach((e) => socket.off(e, refresh));
  }, [workspaceId, qc]);
}
