import { Notification } from '../models/notification.model.js';

export async function list(userId: string, cursor?: string, limit = 30) {
  const q: Record<string, unknown> = { userId };
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

export async function unreadCount(userId: string) {
  return Notification.countDocuments({ userId, read: false });
}

export async function markRead(id: string, userId: string) {
  await Notification.updateOne(
    { _id: id, userId },
    { $set: { read: true, readAt: new Date() } },
  );
}

export async function markAllRead(userId: string) {
  await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } },
  );
}
