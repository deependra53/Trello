import crypto from 'node:crypto';
import { Types } from 'mongoose';
import { Card } from '../models/card.model.js';
import { NotFound } from '../utils/errors.js';
import { getUploadProvider } from '../uploads/providers.js';
import { logActivity } from './activity.service.js';

export async function addAttachment(
  cardId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
  actorId: string,
) {
  const card = await Card.findById(cardId);
  if (!card) throw NotFound('Card not found');

  const provider = getUploadProvider();
  const stored = await provider.store({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder: String(card.boardId),
  });

  const attachment = {
    id: crypto.randomUUID(),
    name: file.originalname,
    url: stored.url,
    mimeType: stored.mimeType,
    size: stored.size,
    uploadedBy: new Types.ObjectId(actorId),
    uploadedAt: new Date(),
    isCover: false,
  };

  await Card.updateOne({ _id: cardId }, { $push: { attachments: attachment } });
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId,
    type: 'card.attachment.added',
    payload: { name: file.originalname, url: stored.url },
  });
  return attachment;
}

export async function presignAttachment(
  cardId: string,
  input: { name: string; mimeType: string },
) {
  const card = await Card.findById(cardId);
  if (!card) throw NotFound('Card not found');
  const provider = getUploadProvider();
  const presigned = await provider.presignPut({
    originalName: input.name,
    mimeType: input.mimeType,
    folder: String(card.boardId),
  });
  return presigned;
}

export async function registerAttachment(
  cardId: string,
  input: { name: string; url: string; key?: string; mimeType?: string; size?: number },
  actorId: string,
) {
  const card = await Card.findById(cardId);
  if (!card) throw NotFound('Card not found');

  const attachment = {
    id: crypto.randomUUID(),
    name: input.name,
    url: input.url,
    mimeType: input.mimeType,
    size: input.size,
    uploadedBy: new Types.ObjectId(actorId),
    uploadedAt: new Date(),
    isCover: false,
  };

  await Card.updateOne({ _id: cardId }, { $push: { attachments: attachment } });
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId,
    type: 'card.attachment.added',
    payload: { name: input.name, url: input.url },
  });
  return attachment;
}

export async function removeAttachment(cardId: string, attachmentId: string, actorId: string) {
  const card = await Card.findById(cardId);
  if (!card) throw NotFound('Card not found');
  const att = card.attachments?.find((a) => a.id === attachmentId);
  if (!att) throw NotFound('Attachment not found');

  await Card.updateOne(
    { _id: cardId },
    { $pull: { attachments: { id: attachmentId } } },
  );

  if (att.url?.startsWith('/uploads/')) {
    await getUploadProvider().delete(att.url.replace('/uploads/', ''));
  }
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId,
    type: 'card.attachment.removed',
    payload: { name: att.name },
  });
}

export async function setCover(cardId: string, attachmentId: string, actorId: string) {
  const card = await Card.findById(cardId);
  if (!card) throw NotFound('Card not found');
  const att = card.attachments?.find((a) => a.id === attachmentId);
  if (!att) throw NotFound('Attachment not found');
  card.cover = { type: 'attachment', value: att.url, size: 'normal', brightness: 'light' };
  for (const a of card.attachments ?? []) {
    a.isCover = a.id === attachmentId;
  }
  await card.save();
  await logActivity({
    boardId: card.boardId,
    cardId: card._id,
    actorId,
    type: 'card.cover.set',
    payload: { attachmentId },
  });
  return card;
}
