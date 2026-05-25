import { InboxItem } from '../models/inboxItem.model.js';
import { create as createCard } from './card.service.js';
import { NotFound } from '../utils/errors.js';

export async function list(userId: string) {
  return InboxItem.find({ userId, archivedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .lean();
}

export async function capture(userId: string, title: string, body: string) {
  return InboxItem.create({ userId, source: 'manual', title, body });
}

export async function snooze(itemId: string, until: Date) {
  await InboxItem.updateOne({ _id: itemId }, { $set: { snoozedUntil: until } });
}

export async function remove(itemId: string) {
  await InboxItem.findByIdAndDelete(itemId);
}

export async function convert(itemId: string, listId: string, userId: string) {
  const item = await InboxItem.findById(itemId);
  if (!item) throw NotFound('Inbox item not found');
  const card = await createCard(listId, item.title, item.body, undefined, userId);
  item.convertedCardId = card._id;
  item.archivedAt = new Date();
  await item.save();
  return card;
}
