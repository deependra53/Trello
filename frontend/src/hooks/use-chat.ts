'use client';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { api, getAccessToken } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type {
  ChannelDetail,
  ChannelSummary,
  ChatAttachment,
  ChatMessage,
  ChatReaction,
  Invite,
  OrgMember,
  ThreadSummary,
  UnreadCounts,
} from '@/types/api';

// ---- Organization members ----------------------------------------------------

export function useOrgMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['org-members', workspaceId],
    enabled: !!workspaceId,
    queryFn: () =>
      api<{ items: OrgMember[] }>(`/api/workspaces/${workspaceId}/members`).then((r) => r.items),
  });
}

export function useInvites(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['org-invites', workspaceId],
    enabled: !!workspaceId,
    queryFn: () =>
      api<{ items: Invite[] }>(`/api/workspaces/${workspaceId}/invites`).then((r) => r.items),
  });
}

export function useCreateInvite(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: 'admin' | 'member' | 'guest' }) =>
      api<Invite>(`/api/workspaces/${workspaceId}/invites`, { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-invites', workspaceId] }),
  });
}

export function useRevokeInvite(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      api(`/api/workspaces/${workspaceId}/invites/${inviteId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-invites', workspaceId] }),
  });
}

// ---- Channels & DMs ----------------------------------------------------------

export function useChannels(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['channels', workspaceId],
    enabled: !!workspaceId,
    queryFn: () =>
      api<{ items: ChannelSummary[] }>(`/api/chat/workspaces/${workspaceId}/channels`).then(
        (r) => r.items,
      ),
  });
}

export function useDms(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['dms', workspaceId],
    enabled: !!workspaceId,
    queryFn: () =>
      api<{ items: ChannelSummary[] }>(`/api/chat/workspaces/${workspaceId}/dms`).then(
        (r) => r.items,
      ),
  });
}

export function useUnread(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['chat-unread', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api<UnreadCounts>(`/api/chat/workspaces/${workspaceId}/unread`),
  });
}

export function useChannel(channelId: string | undefined) {
  return useQuery({
    queryKey: ['channel', channelId],
    enabled: !!channelId,
    queryFn: () => api<ChannelDetail>(`/api/chat/channels/${channelId}`),
  });
}

export function useCreateChannel(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      isPrivate?: boolean;
      memberIds?: string[];
    }) =>
      api<ChannelDetail>(`/api/chat/workspaces/${workspaceId}/channels`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', workspaceId] }),
  });
}

export function useGetOrCreateDm(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      api<ChannelDetail>(`/api/chat/workspaces/${workspaceId}/dms`, {
        method: 'POST',
        body: { userIds },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dms', workspaceId] }),
  });
}

export function useAddChannelMembers(workspaceId: string, channelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      api(`/api/chat/channels/${channelId}/members`, { method: 'POST', body: { userIds } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channel', channelId] });
      qc.invalidateQueries({ queryKey: ['channels', workspaceId] });
    },
  });
}

export function useJoinChannel(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      api(`/api/chat/channels/${channelId}/join`, { method: 'POST' }),
    onSuccess: (_, channelId) => {
      qc.invalidateQueries({ queryKey: ['channel', channelId] });
      qc.invalidateQueries({ queryKey: ['channels', workspaceId] });
    },
  });
}

export function useLeaveChannel(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      api(`/api/chat/channels/${channelId}/leave`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channels', workspaceId] }),
  });
}

export function useUpdateChannel(channelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { name?: string; description?: string; topic?: string }) =>
      api<ChannelDetail>(`/api/chat/channels/${channelId}`, { method: 'PATCH', body: patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channel', channelId] }),
  });
}

// ---- Messages ----------------------------------------------------------------

export const MESSAGE_PAGE_SIZE = 30;
export interface MessagePage {
  items: ChatMessage[];
  nextCursor?: string;
}
type MessageCache = InfiniteData<MessagePage, string | undefined>;

/**
 * A channel's messages, paged backwards through history. The first page is the
 * newest `MESSAGE_PAGE_SIZE` messages; `fetchNextPage` pulls older ones via the
 * `before` cursor. `pages[0]` is always the newest page (oldest pages are
 * appended at the end), and each page's `items` are ascending (oldest→newest).
 */
export function useMessages(channelId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['messages', channelId],
    enabled: !!channelId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api<MessagePage>(`/api/chat/channels/${channelId}/messages`, {
        query: {
          limit: String(MESSAGE_PAGE_SIZE),
          ...(pageParam ? { before: pageParam } : {}),
        },
      }),
    getNextPageParam: (last) => last.nextCursor,
    // Never let the infinite query blanket-refetch on mount/reconnect: that
    // reloads EVERY page with its original cursor and can drop messages at the
    // shifted newest-page seam (see appendMessageToCache). Reconciliation with
    // the server goes exclusively through reconcileChannelMessages, which only
    // merges in missing newest messages and never disturbs older pages.
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

/**
 * Reconcile a channel's cached messages against the server's newest page,
 * merging in anything we don't already have. This is the catch-up path for
 * messages a client missed while its socket was disconnected (room membership
 * is per-connection, so a reconnect silently skips any broadcasts sent during
 * the gap) and for a stale cache restored from IndexedDB on refresh.
 *
 * It is deliberately seam-safe: it ONLY appends missing messages to the newest
 * page and never refetches/replaces older pages, so it can't drop messages at a
 * shifted page boundary the way a full infinite-query refetch can.
 *
 * No-op when the channel has no cache yet — a cold open is handled by
 * useMessages' own initial fetch, so we don't double-load it.
 *
 * Limitation: only the newest `MESSAGE_PAGE_SIZE` server messages are inspected,
 * so a gap larger than one page (a very long disconnect) is only partially
 * filled; the rest reappears once the user scrolls history or clears the cache.
 */
export async function reconcileChannelMessages(qc: QueryClient, channelId: string): Promise<void> {
  if (!qc.getQueryData<MessageCache>(['messages', channelId])) return;
  let fresh: MessagePage;
  try {
    fresh = await api<MessagePage>(`/api/chat/channels/${channelId}/messages`, {
      query: { limit: String(MESSAGE_PAGE_SIZE) },
    });
  } catch {
    return; // transient fetch failure — the next trigger will retry
  }
  qc.setQueryData<MessageCache>(['messages', channelId], (old) => {
    if (!old || old.pages.length === 0) return old;
    const seenIds = new Set<string>();
    const seenClientIds = new Set<string>();
    for (const page of old.pages) {
      for (const m of page.items) {
        seenIds.add(m._id);
        if (m.clientId) seenClientIds.add(m.clientId);
      }
    }
    const missing = fresh.items.filter(
      (m) => !seenIds.has(m._id) && !(m.clientId && seenClientIds.has(m.clientId)),
    );
    if (missing.length === 0) return old;
    const newest = old.pages[0]!;
    const items = [...newest.items, ...missing].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const pages = old.pages.slice();
    pages[0] = { ...newest, items };
    return { ...old, pages };
  });
}

/**
 * Add a top-level message to the newest page of a channel's message cache, in
 * place. We do NOT invalidate the query for new messages: refetching an infinite
 * query reloads every page with its original cursor, and because a new message
 * shifts the newest page's boundary that can silently drop the messages
 * straddling the page seam. A targeted append avoids that entirely (and is
 * smoother). No-op if the cache isn't populated yet.
 *
 * This is the single convergence point for a sent message: the sender's
 * optimistic insert (onMutate), the HTTP response (onSuccess), and the socket
 * echo all funnel through here. Dedupe/reconcile rules, in order:
 *  - already present by real `_id` → no-op (the echo races the HTTP response).
 *  - matches a pending optimistic message by `clientId` → replace it in place,
 *    so the optimistic bubble becomes the real one rather than duplicating.
 *  - otherwise → append to the newest page.
 */
export function appendMessageToCache(qc: QueryClient, channelId: string, message: ChatMessage) {
  qc.setQueryData<MessageCache>(['messages', channelId], (old) => {
    if (!old || old.pages.length === 0) {
      // Cache not populated yet (e.g. a message sent before the first page has
      // loaded): seed a single newest page so the optimistic message still shows
      // instantly. The real useMessages fetch / socket echo reconcile against it.
      return { pages: [{ items: [message], nextCursor: undefined }], pageParams: [undefined] };
    }
    if (old.pages.some((p) => p.items.some((m) => m._id === message._id))) return old;

    const cid = message.clientId;
    if (cid) {
      let replaced = false;
      const pages = old.pages.map((page) => {
        const idx = page.items.findIndex((m) => m._id === cid || m.clientId === cid);
        if (idx === -1) return page;
        replaced = true;
        const items = page.items.slice();
        items[idx] = message;
        return { ...page, items };
      });
      if (replaced) return { ...old, pages };
    }

    const newest = old.pages[0]!;
    const pages = old.pages.slice();
    pages[0] = { ...newest, items: [...newest.items, message] };
    return { ...old, pages };
  });
}

/** Drop a message from a channel's cache by id — used to roll back an optimistic
 *  send that ultimately failed. Matches the optimistic `clientId` as well as the
 *  real `_id`, because the socket echo may have already reconciled the bubble to
 *  its real id before the HTTP request reported failure. No-op if not present. */
export function removeMessageFromCache(qc: QueryClient, channelId: string, idOrClientId: string) {
  qc.setQueryData<MessageCache>(['messages', channelId], (old) => {
    if (!old) return old;
    const hit = (m: ChatMessage) => m._id === idOrClientId || m.clientId === idOrClientId;
    const pages = old.pages.map((page) =>
      page.items.some(hit) ? { ...page, items: page.items.filter((m) => !hit(m)) } : page,
    );
    return { ...old, pages };
  });
}

// ---- Thread reply cache (mirrors the above for the ['replies', parentId] shape).

type RepliesCache = { root: ChatMessage | null; items: ChatMessage[] };

/** Add/reconcile an optimistic reply in a thread's cache. Same dedupe rules as
 *  appendMessageToCache. No-op if the thread isn't loaded — onSuccess invalidates
 *  the replies query, so the real reply still arrives via refetch. */
export function upsertReplyInCache(qc: QueryClient, parentId: string, message: ChatMessage) {
  qc.setQueryData<RepliesCache>(['replies', parentId], (old) => {
    if (!old) return old;
    if (old.items.some((m) => m._id === message._id)) return old;
    const cid = message.clientId;
    if (cid) {
      const idx = old.items.findIndex((m) => m._id === cid || m.clientId === cid);
      if (idx !== -1) {
        const items = old.items.slice();
        items[idx] = message;
        return { ...old, items };
      }
    }
    return { ...old, items: [...old.items, message] };
  });
}

/** Roll a failed optimistic reply back out of a thread's cache. */
export function removeReplyFromCache(qc: QueryClient, parentId: string, idOrClientId: string) {
  qc.setQueryData<RepliesCache>(['replies', parentId], (old) => {
    if (!old) return old;
    return {
      ...old,
      items: old.items.filter((m) => m._id !== idOrClientId && m.clientId !== idOrClientId),
    };
  });
}

/**
 * Pure toggle of one user's reaction on a message — mirrors the backend's
 * `toggleReaction` so the optimistic result matches the server exactly: removing
 * the user from an emoji drops the emoji entirely once nobody's left on it.
 */
export function toggleReactionOnMessage(
  message: ChatMessage,
  emoji: string,
  userId: string,
): ChatMessage {
  const reactions = message.reactions ?? [];
  const existing = reactions.find((r) => r.emoji === emoji);
  let next: ChatReaction[];
  if (!existing) {
    next = [...reactions, { emoji, userIds: [userId] }];
  } else if (existing.userIds.includes(userId)) {
    const userIds = existing.userIds.filter((u) => u !== userId);
    next = userIds.length
      ? reactions.map((r) => (r.emoji === emoji ? { ...r, userIds } : r))
      : reactions.filter((r) => r.emoji !== emoji);
  } else {
    next = reactions.map((r) =>
      r.emoji === emoji ? { ...r, userIds: [...r.userIds, userId] } : r,
    );
  }
  return { ...message, reactions: next };
}

/**
 * Apply `patch` to a single message wherever it currently lives in the chat
 * caches — the channel's message pages, the pins list, and any loaded thread (as
 * root or reply). Used for in-place updates like reaction toggles that must NOT
 * trigger an infinite-query refetch (which can drop messages at a shifted page
 * seam — see appendMessageToCache). No-op for caches that don't hold the message.
 */
export function patchMessageInCaches(
  qc: QueryClient,
  channelId: string,
  messageId: string,
  patch: (m: ChatMessage) => ChatMessage,
) {
  qc.setQueryData<MessageCache>(['messages', channelId], (old) => {
    if (!old) return old;
    let touched = false;
    const pages = old.pages.map((page) => {
      if (!page.items.some((m) => m._id === messageId)) return page;
      touched = true;
      return { ...page, items: page.items.map((m) => (m._id === messageId ? patch(m) : m)) };
    });
    return touched ? { ...old, pages } : old;
  });

  qc.setQueryData<ChatMessage[]>(['pins', channelId], (old) =>
    old?.some((m) => m._id === messageId)
      ? old.map((m) => (m._id === messageId ? patch(m) : m))
      : old,
  );

  for (const [key, data] of qc.getQueriesData<RepliesCache>({ queryKey: ['replies'] })) {
    if (!data) continue;
    const inRoot = data.root?._id === messageId;
    const inItems = data.items.some((m) => m._id === messageId);
    if (!inRoot && !inItems) continue;
    qc.setQueryData<RepliesCache>(key, {
      ...data,
      root: inRoot && data.root ? patch(data.root) : data.root,
      items: inItems ? data.items.map((m) => (m._id === messageId ? patch(m) : m)) : data.items,
    });
  }
}

/**
 * One-shot prefetch when the chat opens for an org: pulls the latest messages
 * for every channel/DM the user belongs to and seeds each channel's message
 * cache, so opening a conversation renders its history instantly instead of
 * flashing the empty state. Fetched once per org (`staleTime: Infinity`) and
 * never clobbers a cache the user has already populated by viewing a channel.
 */
export function useChatBootstrap(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['chat-bootstrap', workspaceId],
    enabled: !!workspaceId,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const r = await api<{ items: Array<{ channelId: string } & MessagePage> }>(
        `/api/chat/workspaces/${workspaceId}/recent`,
      );
      for (const ch of r.items) {
        if (qc.getQueryData(['messages', ch.channelId])) continue;
        qc.setQueryData<MessageCache>(['messages', ch.channelId], {
          pages: [{ items: ch.items, nextCursor: ch.nextCursor }],
          pageParams: [undefined],
        });
      }
      return r.items.length;
    },
  });
}

interface SendMessageInput {
  body?: string;
  mentions?: string[];
  attachments?: { name: string; url: string; mimeType?: string; size?: number }[];
  parentId?: string;
  /** Correlation id so the optimistic message reconciles to the server echo. */
  clientId?: string;
}

export function useSendMessage(channelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      api<ChatMessage>(`/api/chat/channels/${channelId}/messages`, { method: 'POST', body: input }),
    // Render the sender's own message instantly (the network can take a moment) —
    // for both top-level messages and thread replies.
    onMutate: (vars) => {
      if (!vars.clientId) return;
      const me = useAuthStore.getState().user;
      const meId = me?._id ?? me?.id ?? '';
      const optimistic: ChatMessage = {
        _id: vars.clientId,
        clientId: vars.clientId,
        channelId,
        authorId: meId,
        author: me
          ? { _id: meId, fullName: me.fullName, email: me.email, avatarUrl: me.avatarUrl }
          : undefined,
        body: vars.body ?? '',
        mentions: vars.mentions ?? [],
        attachments: (vars.attachments ?? []) as ChatAttachment[],
        parentId: vars.parentId ?? null,
        replyCount: 0,
        reactions: [],
        createdAt: new Date().toISOString(),
        pending: true,
      };
      if (vars.parentId) upsertReplyInCache(qc, vars.parentId, optimistic);
      else appendMessageToCache(qc, channelId, optimistic);
    },
    onError: (_err, vars) => {
      // Roll the optimistic bubble back out; the composer restores the draft.
      if (!vars.clientId) return;
      if (vars.parentId) removeReplyFromCache(qc, vars.parentId, vars.clientId);
      else removeMessageFromCache(qc, channelId, vars.clientId);
    },
    onSuccess: (created, vars) => {
      if (vars.parentId) {
        // A reply bumps the parent's replyCount but adds no top-level message, so
        // refetching the channel pages is safe here (no page-boundary shift).
        qc.invalidateQueries({ queryKey: ['messages', channelId] });
        qc.invalidateQueries({ queryKey: ['replies', vars.parentId] });
        // Replying makes/keeps me a thread participant — refresh the threads inbox.
        qc.invalidateQueries({ queryKey: ['user-threads'] });
      } else {
        // Reconcile the optimistic message to the real one (dedupes vs the echo).
        appendMessageToCache(qc, channelId, created);
      }
    },
  });
}

export function useEditMessage(channelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string; mentions?: string[] }) =>
      api<ChatMessage>(`/api/chat/messages/${messageId}`, { method: 'PATCH', body: { body } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', channelId] }),
  });
}

export function useDeleteMessage(channelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api(`/api/chat/messages/${messageId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', channelId] }),
  });
}

export function useToggleReaction(channelId: string) {
  const qc = useQueryClient();
  const me = () => {
    const u = useAuthStore.getState().user;
    return u?._id ?? u?.id;
  };
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api<ChatMessage>(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        body: { emoji },
      }),
    // Toggle the reaction in the cache the instant the user clicks; the POST runs
    // in parallel so the pill never waits on the round-trip. The toggle is its own
    // inverse, so onError just re-applies it to roll back. We never invalidate
    // ['messages'] (an infinite-query refetch can drop messages at a shifted page
    // seam — see appendMessageToCache); onSuccess reconciles in place instead.
    onMutate: ({ messageId, emoji }) => {
      const meId = me();
      if (!meId) return;
      patchMessageInCaches(qc, channelId, messageId, (m) =>
        toggleReactionOnMessage(m, emoji, meId),
      );
    },
    onError: (_err, { messageId, emoji }) => {
      const meId = me();
      if (!meId) return;
      patchMessageInCaches(qc, channelId, messageId, (m) =>
        toggleReactionOnMessage(m, emoji, meId),
      );
    },
    onSuccess: (server, { messageId }) => {
      // Replace with the server's authoritative reactions, correcting any drift
      // from a concurrent reaction that landed between click and response.
      patchMessageInCaches(qc, channelId, messageId, (m) => ({
        ...m,
        reactions: server.reactions,
      }));
    },
  });
}

export function useSetPin(channelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) =>
      api<ChatMessage>(`/api/chat/messages/${messageId}/pin`, {
        method: pinned ? 'POST' : 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', channelId] });
      qc.invalidateQueries({ queryKey: ['pins', channelId] });
    },
  });
}

export function usePins(channelId: string | undefined) {
  return useQuery({
    queryKey: ['pins', channelId],
    enabled: !!channelId,
    queryFn: () =>
      api<{ items: ChatMessage[] }>(`/api/chat/channels/${channelId}/pins`).then((r) => r.items),
  });
}

export function useReplies(parentId: string | undefined) {
  return useQuery({
    queryKey: ['replies', parentId],
    enabled: !!parentId,
    queryFn: () =>
      api<{ root: ChatMessage | null; items: ChatMessage[] }>(
        `/api/chat/messages/${parentId}/replies`,
      ),
  });
}

/** Threads inbox: every thread the user participates in, cursor-paginated (10/page). */
export function useUserThreads(workspaceId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['user-threads', workspaceId],
    enabled: !!workspaceId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api<{ items: ThreadSummary[]; nextCursor?: string }>(
        `/api/chat/workspaces/${workspaceId}/threads`,
        { query: { limit: '10', ...(pageParam ? { before: pageParam } : {}) } },
      ),
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useSearchMessages(workspaceId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['chat-search', workspaceId, query],
    enabled: !!workspaceId && query.trim().length > 0,
    queryFn: () =>
      api<{ items: ChatMessage[] }>(`/api/chat/workspaces/${workspaceId}/search`, {
        query: { q: query },
      }).then((r) => r.items),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) =>
      api(`/api/chat/channels/${channelId}/read`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-unread'] });
      qc.invalidateQueries({ queryKey: ['channels'] });
      qc.invalidateQueries({ queryKey: ['dms'] });
    },
  });
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Upload an attachment. The multipart body is sent DIRECTLY to the backend
 * (not through the Next dev rewrite, which hangs/ECONNRESETs on streamed
 * uploads); the backend stores it to S3 and returns the public URL.
 */
export async function uploadChatFile(channelId: string, file: File): Promise<ChatAttachment> {
  const form = new FormData();
  form.append('file', file);
  const token = getAccessToken();
  const res = await fetch(`${API_URL}/api/chat/channels/${channelId}/upload`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return (await res.json()) as ChatAttachment;
}
