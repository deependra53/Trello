import { Types } from 'mongoose';
import { Channel, type ChannelDoc } from '../models/channel.model.js';
import { Message, type MessageDoc } from '../models/message.model.js';
import { User } from '../models/user.model.js';
import { Workspace } from '../models/workspace.model.js';
import { BadRequest, Forbidden, NotFound } from '../utils/errors.js';
import { getUploadProvider } from '../uploads/providers.js';
import { emitChannel, emitUser, emitWorkspace } from '../realtime/bus.js';
import * as notificationService from './notification.service.js';
import { sendChannelAddedEmail } from './email.service.js';
import { env } from '../config/env.js';

/**
 * Notify users who were just added to a channel — an in-app notification plus an
 * email — so they know they've been added. Skips the actor and DMs.
 */
async function notifyChannelMembersAdded(
  channel: ChannelDoc,
  addedUserIds: string[],
  actorId: string,
): Promise<void> {
  if (channel.kind === 'dm') return;
  const recipients = [...new Set(addedUserIds.map(String))].filter((id) => id !== actorId);
  if (!recipients.length) return;

  const [actor, org, users] = await Promise.all([
    User.findById(actorId).select('fullName').lean(),
    Workspace.findById(channel.workspaceId).select('name').lean(),
    User.find({ _id: { $in: recipients } })
      .select('fullName email')
      .lean(),
  ]);
  const actorName = actor?.fullName ?? 'Someone';
  const orgName = org?.name ?? 'your organization';
  const channelName = channel.name || 'a channel';
  const link = `/chat/${String(channel._id)}`;

  await Promise.all(
    users.map((u) =>
      notificationService.create({
        userId: String(u._id),
        actorId,
        type: 'channel.added',
        title: `${actorName} added you to #${channelName}`,
        body: `You're now a member of #${channelName} in ${orgName}.`,
        link,
      }),
    ),
  );
  // Emails are best-effort — never block the add on a mail hiccup.
  users.forEach((u) =>
    sendChannelAddedEmail(
      u.email,
      u.fullName,
      channelName,
      orgName,
      actorName,
      `${env.APP_URL}${link}`,
    ).catch(() => undefined),
  );
}

// ---- Helpers ----------------------------------------------------------------

interface MemberProfile {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

async function profilesFor(ids: Array<string | Types.ObjectId>): Promise<Map<string, MemberProfile>> {
  const unique = [...new Set(ids.map((i) => String(i)))];
  if (!unique.length) return new Map();
  const docs = await User.find({ _id: { $in: unique } })
    .select('fullName email avatarUrl')
    .lean();
  return new Map(
    docs.map((u) => [
      String(u._id),
      { _id: String(u._id), fullName: u.fullName, email: u.email, avatarUrl: u.avatarUrl ?? undefined },
    ]),
  );
}

export function dmKeyFor(userIds: string[]): string {
  return [...new Set(userIds.map(String))].sort().join(':');
}

function isMember(channel: ChannelDoc, userId: string): boolean {
  return Boolean(channel.members?.some((m) => String(m.userId) === userId));
}

/** Accepts either a hydrated MessageDoc or a `.lean()` plain object. */
interface SerializableMessage {
  _id: unknown;
  channelId: unknown;
  authorId: unknown;
  body?: string;
  deletedAt?: Date | null;
  mentions?: unknown[];
  attachments?: Array<{ name: string; url: string; mimeType?: string; size?: number }>;
  parentId?: unknown;
  replyCount?: number;
  lastReplyAt?: Date | null;
  reactions?: Array<{ emoji: string; userIds?: unknown[] }>;
  pinned?: boolean;
  pinnedBy?: unknown;
  editedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

function serializeMessage(msg: SerializableMessage, author?: MemberProfile) {
  const deleted = Boolean(msg.deletedAt);
  return {
    _id: String(msg._id),
    channelId: String(msg.channelId),
    authorId: String(msg.authorId),
    author,
    body: deleted ? '' : (msg.body ?? ''),
    deleted,
    mentions: (msg.mentions ?? []).map(String),
    attachments: deleted ? [] : (msg.attachments ?? []),
    parentId: msg.parentId ? String(msg.parentId) : null,
    replyCount: msg.replyCount ?? 0,
    lastReplyAt: msg.lastReplyAt,
    reactions: (msg.reactions ?? []).map((r) => ({
      emoji: r.emoji,
      userIds: (r.userIds ?? []).map(String),
    })),
    pinned: Boolean(msg.pinned),
    pinnedBy: msg.pinnedBy ? String(msg.pinnedBy) : undefined,
    editedAt: msg.editedAt,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  };
}

type OrgRole = 'owner' | 'admin' | 'member' | 'guest';

/** The user's role in the org, or null if they don't belong to it. */
async function workspaceRoleOf(
  workspaceId: string | Types.ObjectId,
  userId: string,
): Promise<OrgRole | null> {
  const ws = await Workspace.findById(workspaceId).select('ownerId members').lean();
  if (!ws) return null;
  if (String(ws.ownerId) === userId) return 'owner';
  const role = ws.members?.find((m) => String(m.userId) === userId)?.role;
  return (role as OrgRole | undefined) ?? null;
}

async function requireWorkspaceMember(workspaceId: string, userId: string): Promise<OrgRole> {
  const role = await workspaceRoleOf(workspaceId, userId);
  if (!role) throw Forbidden('Not a member of this organization');
  return role;
}

/**
 * Throws unless the user may read the channel. Explicit members always pass.
 * Public channels are discoverable by full org members, but NOT by guests —
 * a guest (e.g. someone who joined via a board invite) only has chat access to
 * channels an admin has explicitly added them to.
 */
async function assertChannelAccess(channelId: string | Types.ObjectId, userId: string): Promise<void> {
  const channel = await Channel.findById(channelId).select('kind isPrivate members workspaceId').lean();
  if (!channel) throw NotFound('Channel not found');
  if (channel.members?.some((m) => String(m.userId) === userId)) return;
  if (channel.kind === 'channel' && !channel.isPrivate) {
    const role = await workspaceRoleOf(channel.workspaceId, userId);
    if (role && role !== 'guest') return;
  }
  throw Forbidden('You are not a member of this conversation');
}

/**
 * Load a message the caller is allowed to read (channel access enforced) so it
 * can be turned into a board card. Returns just the pieces the card needs: the
 * source channel's name/kind (→ card title), the body (→ description) and any
 * attachments (→ card attachments). Soft-deleted messages 404.
 */
export async function getMessageForCard(messageId: string, userId: string) {
  const message = await Message.findById(messageId).lean();
  if (!message || message.deletedAt) throw NotFound('Message not found');
  await assertChannelAccess(message.channelId, userId);
  const channel = await Channel.findById(message.channelId).select('name kind').lean();
  return {
    workspaceId: String(message.workspaceId),
    channelName: channel?.name ?? '',
    channelKind: (channel?.kind ?? 'channel') as 'channel' | 'dm',
    body: message.body ?? '',
    attachments: (message.attachments ?? []).map((a) => ({
      name: a.name,
      url: a.url,
      mimeType: a.mimeType,
      size: a.size,
    })),
  };
}

// ---- Channels ---------------------------------------------------------------

export async function listChannelsFor(workspaceId: string, userId: string) {
  const role = await requireWorkspaceMember(workspaceId, userId);
  // Full members see channels they belong to plus any public channel (discoverable
  // / joinable). Guests only ever see channels they've been explicitly added to.
  const filter =
    role === 'guest'
      ? { workspaceId, kind: 'channel', archived: false, 'members.userId': userId }
      : {
          workspaceId,
          kind: 'channel',
          archived: false,
          $or: [{ 'members.userId': userId }, { isPrivate: false }],
        };
  const channels = await Channel.find(filter).sort({ name: 1 }).lean();

  const unread = await unreadFor(channels as unknown as ChannelDoc[], userId);
  return channels.map((c) => ({
    _id: String(c._id),
    workspaceId: String(c.workspaceId),
    kind: c.kind,
    name: c.name,
    description: c.description,
    topic: c.topic,
    isPrivate: c.isPrivate,
    memberCount: c.members?.length ?? 0,
    isMember: Boolean(c.members?.some((m) => String(m.userId) === userId)),
    createdBy: c.createdBy ? String(c.createdBy) : undefined,
    lastMessageAt: c.lastMessageAt,
    unreadCount: unread.get(String(c._id)) ?? 0,
  }));
}

export async function listDmsFor(workspaceId: string, userId: string) {
  await requireWorkspaceMember(workspaceId, userId);
  const dms = await Channel.find({
    workspaceId,
    kind: 'dm',
    'members.userId': userId,
  })
    .sort({ lastMessageAt: -1 })
    .lean();

  const otherIds = dms.flatMap((d) => (d.members ?? []).map((m) => String(m.userId)));
  const profiles = await profilesFor(otherIds);
  const unread = await unreadFor(dms as unknown as ChannelDoc[], userId);

  return dms.map((d) => {
    const participants = (d.members ?? [])
      .map((m) => profiles.get(String(m.userId)))
      .filter(Boolean) as MemberProfile[];
    const others = participants.filter((p) => p._id !== userId);
    return {
      _id: String(d._id),
      workspaceId: String(d.workspaceId),
      kind: 'dm' as const,
      participants,
      // Display name/avatar comes from the other participant(s).
      name: others.map((o) => o.fullName).join(', ') || 'You',
      otherUser: others[0],
      lastMessageAt: d.lastMessageAt,
      unreadCount: unread.get(String(d._id)) ?? 0,
    };
  });
}

export async function getChannel(channelId: string, userId: string) {
  const channel = await Channel.findById(channelId).lean();
  if (!channel) throw NotFound('Channel not found');
  const profiles = await profilesFor((channel.members ?? []).map((m) => String(m.userId)));
  return {
    _id: String(channel._id),
    workspaceId: String(channel.workspaceId),
    kind: channel.kind,
    name: channel.name,
    description: channel.description,
    topic: channel.topic,
    isPrivate: channel.isPrivate,
    archived: channel.archived,
    createdBy: channel.createdBy ? String(channel.createdBy) : undefined,
    isMember: Boolean(channel.members?.some((m) => String(m.userId) === userId)),
    members: (channel.members ?? []).map((m) => ({
      userId: String(m.userId),
      role: m.role,
      profile: profiles.get(String(m.userId)),
    })),
  };
}

interface CreateChannelInput {
  name: string;
  description?: string;
  topic?: string;
  isPrivate?: boolean;
  memberIds?: string[];
}

export async function createChannel(
  workspaceId: string,
  creatorId: string,
  input: CreateChannelInput,
) {
  await requireWorkspaceMember(workspaceId, creatorId);
  const memberIds = [...new Set([creatorId, ...(input.memberIds ?? [])])];
  const channel = await Channel.create({
    workspaceId: new Types.ObjectId(workspaceId),
    kind: 'channel',
    name: input.name,
    description: input.description ?? '',
    topic: input.topic ?? '',
    isPrivate: input.isPrivate ?? false,
    createdBy: new Types.ObjectId(creatorId),
    members: memberIds.map((id) => ({
      userId: new Types.ObjectId(id),
      role: id === creatorId ? 'owner' : 'member',
      joinedAt: new Date(),
      lastReadAt: new Date(),
    })),
  });
  // Public channels are visible org-wide; let every member's sidebar refresh.
  emitWorkspace({ workspaceId, type: 'channel.created', actorId: creatorId, payload: { channelId: String(channel._id) } });
  memberIds.forEach((id) => emitUser({ userId: id, type: 'channel.created', payload: { channelId: String(channel._id) } }));
  // Notify everyone added at creation (besides the creator).
  await notifyChannelMembersAdded(channel, memberIds, creatorId);
  return getChannel(String(channel._id), creatorId);
}

export async function updateChannel(
  channelId: string,
  patch: { name?: string; description?: string; topic?: string },
  actorId: string,
) {
  const channel = await Channel.findByIdAndUpdate(channelId, { $set: patch }, { new: true });
  if (!channel) throw NotFound('Channel not found');
  emitChannel({ channelId, type: 'channel.updated', actorId, payload: patch });
  return getChannel(channelId, actorId);
}

export async function addMembers(channelId: string, userIds: string[], actorId: string) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw NotFound('Channel not found');
  await requireWorkspaceMember(String(channel.workspaceId), actorId);
  const existing = new Set((channel.members ?? []).map((m) => String(m.userId)));
  const added: string[] = [];
  for (const id of userIds) {
    if (existing.has(id)) continue;
    channel.members?.push({
      userId: new Types.ObjectId(id),
      role: 'member',
      joinedAt: new Date(),
      lastReadAt: new Date(),
    });
    added.push(id);
  }
  await channel.save();
  emitChannel({ channelId, type: 'channel.member.joined', actorId, payload: { added } });
  added.forEach((id) =>
    emitUser({ userId: id, type: 'channel.created', payload: { channelId } }),
  );
  await notifyChannelMembersAdded(channel, added, actorId);
  return getChannel(channelId, actorId);
}

export async function leaveChannel(channelId: string, userId: string) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw NotFound('Channel not found');
  if (channel.kind === 'dm') throw BadRequest('You cannot leave a direct message');
  await Channel.updateOne(
    { _id: channelId },
    { $pull: { members: { userId: new Types.ObjectId(userId) } } },
  );
  emitChannel({ channelId, type: 'channel.member.left', actorId: userId, payload: { userId } });
  emitUser({ userId, type: 'channel.left', payload: { channelId } });
}

export async function joinChannel(channelId: string, userId: string) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw NotFound('Channel not found');
  if (channel.kind !== 'channel' || channel.isPrivate) {
    throw Forbidden('This channel is private');
  }
  const role = await requireWorkspaceMember(String(channel.workspaceId), userId);
  if (role === 'guest') throw Forbidden('Ask an organization admin to add you to channels');
  if (!isMember(channel, userId)) {
    channel.members?.push({
      userId: new Types.ObjectId(userId),
      role: 'member',
      joinedAt: new Date(),
      lastReadAt: new Date(),
    });
    await channel.save();
    emitChannel({ channelId, type: 'channel.member.joined', actorId: userId, payload: { added: [userId] } });
    emitUser({ userId, type: 'channel.created', payload: { channelId } });
  }
  return getChannel(channelId, userId);
}

export async function getOrCreateDm(workspaceId: string, userIds: string[]) {
  const ids = [...new Set(userIds.map(String))];
  if (ids.length < 2) throw BadRequest('A direct message needs at least two participants');
  await Promise.all(ids.map((id) => requireWorkspaceMember(workspaceId, id)));
  const dmKey = dmKeyFor(ids);
  let channel = await Channel.findOne({ workspaceId, kind: 'dm', dmKey });
  if (!channel) {
    channel = await Channel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      kind: 'dm',
      dmKey,
      members: ids.map((id) => ({
        userId: new Types.ObjectId(id),
        role: 'member',
        joinedAt: new Date(),
        lastReadAt: new Date(),
      })),
    });
    ids.forEach((id) => emitUser({ userId: id, type: 'dm.created', payload: { channelId: String(channel!._id) } }));
  }
  return getChannel(String(channel._id), ids[0] as string);
}

// ---- Messages ---------------------------------------------------------------

export async function listMessages(
  channelId: string,
  opts: { before?: string; limit?: number } = {},
) {
  const limit = Math.min(opts.limit ?? 30, 100);
  const q: Record<string, unknown> = { channelId, parentId: null };
  if (opts.before) q.createdAt = { $lt: new Date(opts.before) };
  const docs = await Message.find(q).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  if (hasMore) docs.pop();
  const ordered = docs.reverse(); // ascending for display
  const profiles = await profilesFor(ordered.map((m) => String(m.authorId)));
  const items = ordered.map((m) => serializeMessage(m, profiles.get(String(m.authorId))));
  const first = ordered[0];
  return {
    items,
    nextCursor: hasMore && first ? (first.createdAt as Date).toISOString() : undefined,
  };
}

type SerializedMessage = ReturnType<typeof serializeMessage>;

/**
 * The latest top-level messages for several channels at once, in a single
 * aggregation. Mirrors {@link listMessages} per channel (ascending order,
 * includes soft-deleted messages, `nextCursor` set when an older page exists)
 * so the client can seed each channel's first message page from one request.
 */
async function recentMessagesByChannel(
  channelIds: Types.ObjectId[],
  limit = 20,
): Promise<Map<string, { items: SerializedMessage[]; nextCursor?: string }>> {
  if (!channelIds.length) return new Map();
  const grouped = await Message.aggregate<{ _id: Types.ObjectId; docs: SerializableMessage[] }>([
    { $match: { channelId: { $in: channelIds }, parentId: null } },
    {
      $group: {
        _id: '$channelId',
        // One extra so we can tell whether an older page exists (the cursor).
        docs: { $topN: { n: limit + 1, sortBy: { createdAt: -1, _id: -1 }, output: '$$ROOT' } },
      },
    },
  ]);
  const profiles = await profilesFor(grouped.flatMap((g) => g.docs.map((d) => String(d.authorId))));
  const result = new Map<string, { items: SerializedMessage[]; nextCursor?: string }>();
  for (const g of grouped) {
    const docs = g.docs.slice(); // newest-first from $topN
    const hasMore = docs.length > limit;
    if (hasMore) docs.pop(); // drop the oldest (the extra)
    const ordered = docs.reverse(); // ascending for display
    const items = ordered.map((m) => serializeMessage(m, profiles.get(String(m.authorId))));
    const first = ordered[0];
    result.set(String(g._id), {
      items,
      nextCursor: hasMore && first ? (first.createdAt as Date).toISOString() : undefined,
    });
  }
  return result;
}

/**
 * Recent messages for every conversation the user belongs to (member channels +
 * DMs) in a workspace, to seed the chat client on open so a channel renders its
 * history instantly instead of flashing the empty "welcome" state. Channels with
 * no messages are simply omitted.
 */
export async function listRecentMessages(workspaceId: string, userId: string) {
  await requireWorkspaceMember(workspaceId, userId);
  const channels = await Channel.find({ workspaceId, 'members.userId': userId })
    .select('_id')
    .lean();
  const ids = channels.map((c) => c._id as Types.ObjectId);
  const byChannel = await recentMessagesByChannel(ids);
  const items: Array<{ channelId: string; items: SerializedMessage[]; nextCursor?: string }> = [];
  for (const id of ids) {
    const recent = byChannel.get(String(id));
    if (recent && recent.items.length) {
      items.push({ channelId: String(id), items: recent.items, nextCursor: recent.nextCursor });
    }
  }
  return { items };
}

interface SendMessageInput {
  body?: string;
  mentions?: string[];
  attachments?: Array<{ name: string; url: string; mimeType?: string; size?: number }>;
  parentId?: string;
  /** Opaque sender-supplied correlation id, echoed back so the client can
   *  reconcile its optimistic message (never persisted). */
  clientId?: string;
}

export async function sendMessage(channelId: string, authorId: string, input: SendMessageInput) {
  const channel = await Channel.findById(channelId);
  if (!channel) throw NotFound('Channel not found');

  const body = (input.body ?? '').trim();
  if (!body && !(input.attachments?.length)) {
    throw BadRequest('Message cannot be empty');
  }

  // Auto-join public channels on first post (Slack behaviour) — but not guests,
  // who need an admin to add them before they can participate in chat.
  if (!isMember(channel, authorId)) {
    if (channel.kind === 'channel' && !channel.isPrivate) {
      const role = await requireWorkspaceMember(String(channel.workspaceId), authorId);
      if (role === 'guest') throw Forbidden('Ask an organization admin to add you to channels');
      channel.members?.push({
        userId: new Types.ObjectId(authorId),
        role: 'member',
        joinedAt: new Date(),
        lastReadAt: new Date(),
      });
    } else {
      throw Forbidden('You are not a member of this conversation');
    }
  }

  const mentions = [...new Set((input.mentions ?? []).map(String))];
  const message = await Message.create({
    channelId: channel._id,
    workspaceId: channel.workspaceId,
    authorId: new Types.ObjectId(authorId),
    body,
    mentions: mentions.map((id) => new Types.ObjectId(id)),
    attachments: input.attachments ?? [],
    parentId: input.parentId ? new Types.ObjectId(input.parentId) : null,
  });

  // Thread bookkeeping on the parent message.
  if (input.parentId) {
    await Message.updateOne(
      { _id: input.parentId },
      { $inc: { replyCount: 1 }, $set: { lastReplyAt: new Date() } },
    );
  }

  channel.lastMessageAt = new Date();
  // Mark the author as caught up.
  const me = channel.members?.find((m) => String(m.userId) === authorId);
  if (me) me.lastReadAt = new Date();
  await channel.save();

  const profiles = await profilesFor([authorId]);
  // Echo the sender's correlation id so their optimistic message reconciles to
  // this real one (the broadcast reaches the sender too) instead of duplicating.
  const serialized = { ...serializeMessage(message, profiles.get(authorId)), clientId: input.clientId };

  // Live update to anyone viewing the channel.
  emitChannel({ channelId, type: 'message.new', actorId: authorId, payload: { message: serialized } });

  // Unread badges + new-DM surfacing for members not currently in the room.
  const memberIds = (channel.members ?? []).map((m) => String(m.userId));
  memberIds
    .filter((id) => id !== authorId)
    .forEach((id) => emitUser({ userId: id, type: 'chat.activity', payload: { channelId, kind: channel.kind } }));

  // @mention notifications.
  const authorName = profiles.get(authorId)?.fullName ?? 'Someone';
  const channelLabel = channel.kind === 'dm' ? 'a direct message' : `#${channel.name}`;
  await Promise.all(
    mentions
      .filter((id) => id !== authorId && memberIds.includes(id))
      .map((id) =>
        notificationService.create({
          userId: id,
          actorId: authorId,
          type: 'chat.mention',
          title: `${authorName} mentioned you in ${channelLabel}`,
          body: body.slice(0, 140),
          link: `/chat/${channelId}`,
        }),
      ),
  );

  return serialized;
}

async function loadOwnMessage(messageId: string, userId: string): Promise<MessageDoc> {
  const message = await Message.findById(messageId);
  if (!message || message.deletedAt) throw NotFound('Message not found');
  if (String(message.authorId) !== userId) throw Forbidden('You can only modify your own messages');
  return message;
}

export async function editMessage(messageId: string, userId: string, body: string, mentions?: string[]) {
  const message = await loadOwnMessage(messageId, userId);
  message.body = body.trim();
  if (mentions) message.mentions = [...new Set(mentions.map(String))].map((id) => new Types.ObjectId(id));
  message.editedAt = new Date();
  await message.save();
  const profiles = await profilesFor([userId]);
  const serialized = serializeMessage(message, profiles.get(userId));
  emitChannel({ channelId: String(message.channelId), type: 'message.updated', actorId: userId, payload: { message: serialized } });
  return serialized;
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await loadOwnMessage(messageId, userId);
  message.deletedAt = new Date();
  message.body = '';
  message.set('attachments', []);
  await message.save();
  emitChannel({ channelId: String(message.channelId), type: 'message.deleted', actorId: userId, payload: { messageId } });
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  const message = await Message.findById(messageId);
  if (!message || message.deletedAt) throw NotFound('Message not found');
  await assertChannelAccess(message.channelId, userId);
  const reaction = message.reactions?.find((r) => r.emoji === emoji);
  if (reaction) {
    const idx = reaction.userIds.findIndex((u) => String(u) === userId);
    if (idx >= 0) {
      reaction.userIds.splice(idx, 1);
      if (reaction.userIds.length === 0) {
        message.set('reactions', message.reactions?.filter((r) => r.emoji !== emoji) ?? []);
      }
    } else {
      reaction.userIds.push(new Types.ObjectId(userId));
    }
  } else {
    message.reactions?.push({ emoji, userIds: [new Types.ObjectId(userId)] });
  }
  await message.save();
  const serialized = serializeMessage(message);
  emitChannel({ channelId: String(message.channelId), type: 'message.reaction', actorId: userId, payload: { message: serialized } });
  return serialized;
}

export async function setPinned(messageId: string, userId: string, pinned: boolean) {
  const message = await Message.findById(messageId);
  if (!message || message.deletedAt) throw NotFound('Message not found');
  await assertChannelAccess(message.channelId, userId);
  message.pinned = pinned;
  message.pinnedBy = pinned ? new Types.ObjectId(userId) : undefined;
  message.pinnedAt = pinned ? new Date() : undefined;
  await message.save();
  emitChannel({ channelId: String(message.channelId), type: 'message.pinned', actorId: userId, payload: { messageId, pinned } });
  return serializeMessage(message);
}

export async function listPins(channelId: string) {
  const docs = await Message.find({ channelId, pinned: true, deletedAt: null })
    .sort({ pinnedAt: -1 })
    .lean();
  const profiles = await profilesFor(docs.map((m) => String(m.authorId)));
  return docs.map((m) => serializeMessage(m, profiles.get(String(m.authorId))));
}

export async function listReplies(parentId: string, userId: string) {
  const parent = await Message.findById(parentId).select('channelId authorId').lean();
  if (!parent) throw NotFound('Message not found');
  await assertChannelAccess(parent.channelId, userId);
  const root = await Message.findById(parentId).lean();
  const docs = await Message.find({ parentId }).sort({ createdAt: 1 }).lean();
  const all = root ? [root, ...docs] : docs;
  const profiles = await profilesFor(all.map((m) => String(m.authorId)));
  return {
    root: root ? serializeMessage(root, profiles.get(String(root.authorId))) : null,
    items: docs.map((m) => serializeMessage(m, profiles.get(String(m.authorId)))),
  };
}

/**
 * Threads inbox: every thread the user has participated in (started the root, or
 * replied) across the org's channels + DMs, newest activity first. Cursor-paginated
 * by the root's `lastReplyAt` so the client can lazily scroll older threads.
 */
export async function listUserThreads(
  workspaceId: string,
  userId: string,
  opts: { before?: string; limit?: number } = {},
) {
  await requireWorkspaceMember(workspaceId, userId);
  const limit = Math.min(opts.limit ?? 10, 50);
  const uid = new Types.ObjectId(userId);

  // Participants are always members (posting/replying auto-joins). Scope to the
  // channels the user currently belongs to — this also lets us resolve DM names
  // and read my per-channel "seen at" cutoff for the unread dot.
  const channels = await Channel.find({ workspaceId, 'members.userId': uid })
    .select('_id kind name members')
    .lean();
  const channelIds = channels.map((c) => c._id);
  if (!channelIds.length) return { items: [], nextCursor: undefined };
  const chanById = new Map(channels.map((c) => [String(c._id), c]));
  const channelReadAt = new Map<string, number>();
  for (const c of channels) {
    const me = c.members?.find((m) => String(m.userId) === userId);
    if (me?.lastReadAt) channelReadAt.set(String(c._id), new Date(me.lastReadAt).getTime());
  }

  // Thread roots the user replied to.
  const repliedRootIds = await Message.distinct('parentId', {
    channelId: { $in: channelIds },
    authorId: uid,
    parentId: { $ne: null },
    deletedAt: null,
  });

  // Thread roots the user participates in, newest activity first, cursor-paginated.
  const q: Record<string, unknown> = {
    channelId: { $in: channelIds },
    parentId: null,
    deletedAt: null,
    replyCount: { $gt: 0 },
    $or: [{ authorId: uid }, { _id: { $in: repliedRootIds } }],
  };
  if (opts.before) q.lastReplyAt = { $lt: new Date(opts.before) };
  const roots = await Message.find(q).sort({ lastReplyAt: -1 }).limit(limit + 1).lean();
  const hasMore = roots.length > limit;
  if (hasMore) roots.pop();
  const rootIds = roots.map((r) => r._id);

  // The two newest non-deleted replies per root (preview), in one aggregation.
  const latest = await Message.aggregate<{ _id: Types.ObjectId; docs: MessageDoc[] }>([
    { $match: { parentId: { $in: rootIds }, deletedAt: null } },
    {
      $group: {
        _id: '$parentId',
        docs: { $topN: { n: 2, sortBy: { createdAt: -1, _id: -1 }, output: '$$ROOT' } },
      },
    },
  ]);
  const recentByRoot = new Map(latest.map((r) => [String(r._id), r.docs]));
  // Newest reply author per root → suppress the unread dot for threads whose
  // latest message I posted myself.
  const lastAuthorByRoot = new Map(
    latest.map((r) => [String(r._id), String(r.docs[0]?.authorId ?? '')]),
  );

  // Distinct participants per root (root author + repliers), for the avatar stack.
  const participantAgg = await Message.aggregate<{ _id: Types.ObjectId; authorIds: Types.ObjectId[] }>([
    {
      $match: {
        $or: [{ _id: { $in: rootIds } }, { parentId: { $in: rootIds } }],
        deletedAt: null,
      },
    },
    { $project: { rootId: { $ifNull: ['$parentId', '$_id'] }, authorId: 1 } },
    { $group: { _id: '$rootId', authorIds: { $addToSet: '$authorId' } } },
  ]);
  const participantsByRoot = new Map(
    participantAgg.map((p) => [String(p._id), p.authorIds.map(String)]),
  );

  // Roots (in this page) where I'm @-mentioned anywhere → "mentioned you" label.
  const mentionAgg = await Message.aggregate<{ _id: Types.ObjectId }>([
    {
      $match: {
        $or: [{ _id: { $in: rootIds } }, { parentId: { $in: rootIds } }],
        deletedAt: null,
        mentions: uid,
      },
    },
    { $project: { rootId: { $ifNull: ['$parentId', '$_id'] } } },
    { $group: { _id: '$rootId' } },
  ]);
  const mentionRootIds = new Set(mentionAgg.map((m) => String(m._id)));

  // One profile lookup for root authors, reply authors, participants, DM counterparts.
  const dmOtherIds = channels
    .filter((c) => c.kind === 'dm')
    .map((c) => c.members?.find((m) => String(m.userId) !== userId)?.userId)
    .filter((id): id is Types.ObjectId => Boolean(id));
  const profiles = await profilesFor([
    ...roots.map((r) => r.authorId),
    ...latest.flatMap((r) => r.docs.map((d) => d.authorId)),
    ...participantAgg.flatMap((p) => p.authorIds),
    ...dmOtherIds,
  ]);

  const items = roots.map((r) => {
    const rid = String(r._id);
    const c = chanById.get(String(r.channelId));
    const otherId =
      c?.kind === 'dm' ? c.members?.find((m) => String(m.userId) !== userId)?.userId : undefined;
    const rootMsg = serializeMessage(r, profiles.get(String(r.authorId)));
    // Last up to two messages of the thread, oldest-first. With 2+ replies that's
    // the two most recent replies; with a single reply it's the root + that reply.
    const recent = (recentByRoot.get(rid) ?? [])
      .slice()
      .reverse()
      .map((d) => serializeMessage(d, profiles.get(String(d.authorId))));
    const lastMessages =
      recent.length >= 2 ? recent : recent.length === 1 ? [rootMsg, recent[0]!] : [rootMsg];

    const participantIds = participantsByRoot.get(rid) ?? [String(r.authorId)];
    const participants = participantIds
      .map((id) => profiles.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, 8)
      .map((p) => ({ _id: p._id, fullName: p.fullName, avatarUrl: p.avatarUrl }));

    const lastReplyMs = r.lastReplyAt ? new Date(r.lastReplyAt).getTime() : 0;
    const lastAuthor = lastAuthorByRoot.get(rid) || String(r.authorId);
    const unread =
      lastReplyMs > (channelReadAt.get(String(r.channelId)) ?? 0) && lastAuthor !== userId;

    return {
      root: rootMsg,
      channel: c
        ? {
            _id: String(c._id),
            kind: c.kind,
            name:
              c.kind === 'dm'
                ? profiles.get(String(otherId))?.fullName ?? 'Direct message'
                : c.name,
          }
        : null,
      lastMessages,
      participants,
      participantCount: participantIds.length,
      unread,
      mentioned: mentionRootIds.has(rid),
    };
  });

  const tail = roots[roots.length - 1];
  return {
    items,
    nextCursor: hasMore && tail ? (tail.lastReplyAt as Date).toISOString() : undefined,
  };
}

// ---- Read state + unread ----------------------------------------------------

export async function markRead(channelId: string, userId: string) {
  await Channel.updateOne(
    { _id: channelId, 'members.userId': new Types.ObjectId(userId) },
    { $set: { 'members.$.lastReadAt': new Date() } },
  );
  emitUser({ userId, type: 'chat.read', payload: { channelId } });
}

async function unreadFor(channels: ChannelDoc[], userId: string): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  await Promise.all(
    channels.map(async (c) => {
      const member = c.members?.find((m) => String(m.userId) === userId);
      if (!member) {
        result.set(String(c._id), 0);
        return;
      }
      const count = await Message.countDocuments({
        channelId: c._id,
        parentId: null,
        deletedAt: null,
        authorId: { $ne: new Types.ObjectId(userId) },
        createdAt: { $gt: member.lastReadAt ?? new Date(0) },
      });
      result.set(String(c._id), count);
    }),
  );
  return result;
}

export async function unreadCounts(workspaceId: string, userId: string) {
  const channels = await Channel.find({
    workspaceId,
    'members.userId': userId,
  }).lean();
  const map = await unreadFor(channels as unknown as ChannelDoc[], userId);
  const byChannel: Record<string, number> = {};
  let total = 0;
  for (const [id, count] of map) {
    byChannel[id] = count;
    total += count;
  }
  return { total, byChannel };
}

// ---- Search -----------------------------------------------------------------

export async function searchMessages(workspaceId: string, userId: string, query: string) {
  const q = query.trim();
  if (!q) return { items: [] };
  // Only search within channels the user belongs to.
  const channels = await Channel.find({ workspaceId, 'members.userId': userId })
    .select('_id name kind')
    .lean();
  const channelMap = new Map(channels.map((c) => [String(c._id), c]));
  if (channelMap.size === 0) return { items: [] };

  const docs = await Message.find({
    workspaceId,
    channelId: { $in: [...channelMap.keys()].map((id) => new Types.ObjectId(id)) },
    deletedAt: null,
    $text: { $search: q },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const profiles = await profilesFor(docs.map((m) => String(m.authorId)));
  return {
    items: docs.map((m) => {
      const ch = channelMap.get(String(m.channelId));
      return {
        ...serializeMessage(m, profiles.get(String(m.authorId))),
        channelName: ch?.name,
        channelKind: ch?.kind,
      };
    }),
  };
}

// ---- Attachments ------------------------------------------------------------

export async function storeUpload(
  channelId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
) {
  const provider = getUploadProvider();
  const stored = await provider.store({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder: `chat/${channelId}`,
  });
  return { name: file.originalname, url: stored.url, mimeType: stored.mimeType, size: stored.size };
}

/**
 * Issue a presigned URL so the browser can upload the file DIRECTLY to the storage
 * provider (S3) — real progress, and the body never goes through the dev proxy.
 * Returns null when the active provider has no presign support (e.g. local disk),
 * in which case the client falls back to the multipart relay endpoint.
 */
export async function presignUpload(channelId: string, opts: { name: string; mimeType: string }) {
  const provider = getUploadProvider();
  return provider.presignPut({
    originalName: opts.name,
    mimeType: opts.mimeType,
    folder: `chat/${channelId}`,
  });
}
