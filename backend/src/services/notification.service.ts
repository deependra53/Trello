import { Notification } from '../models/notification.model.js';
import { emitUser } from '../realtime/bus.js';

/**
 * Notifications are split into two worlds: the always-mounted Chat pane and the
 * Boards app. Each surfaces only its own notifications, so we partition by the
 * notification `type`. Chat-origin types are listed here; everything else
 * (card comments, board invites, automations, …) belongs to Boards.
 */
export type NotificationScope = 'boards' | 'chat';
const CHAT_TYPES = ['chat.mention', 'channel.added'];

function scopeQuery(scope?: NotificationScope): Record<string, unknown> {
  if (scope === 'chat') return { type: { $in: CHAT_TYPES } };
  if (scope === 'boards') return { type: { $nin: CHAT_TYPES } };
  return {};
}

interface CreateNotificationInput {
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}

export async function create(input: CreateNotificationInput) {
  const notif = await Notification.create({
    userId: input.userId,
    actorId: input.actorId,
    type: input.type,
    title: input.title,
    body: input.body ?? '',
    link: input.link,
  });
  emitUser({ userId: input.userId, type: 'notification.new', payload: { id: String(notif._id) } });
  return notif;
}

export async function list(
  userId: string,
  opts: { cursor?: string; scope?: NotificationScope; limit?: number } = {},
) {
  const { cursor, scope, limit = 30 } = opts;
  const q: Record<string, unknown> = { userId, ...scopeQuery(scope) };
  if (cursor) q.createdAt = { $lt: new Date(cursor) };
  const items = await Notification.find(q).sort({ createdAt: -1 }).limit(limit + 1).lean();
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: hasMore && last ? (last.createdAt as Date).toISOString() : undefined,
  };
}

export async function unreadCount(userId: string, scope?: NotificationScope) {
  return Notification.countDocuments({ userId, read: false, ...scopeQuery(scope) });
}

export async function markRead(id: string, userId: string) {
  await Notification.updateOne(
    { _id: id, userId },
    { $set: { read: true, readAt: new Date() } },
  );
}

export async function markAllRead(userId: string, scope?: NotificationScope) {
  await Notification.updateMany(
    { userId, read: false, ...scopeQuery(scope) },
    { $set: { read: true, readAt: new Date() } },
  );
}
