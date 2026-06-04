import type { Request } from 'express';
import * as svc from '../services/chat.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { BadRequest } from '../utils/errors.js';
import type { AuthedRequest } from '../middleware/auth.middleware.js';
import type { ChannelRequest } from '../middleware/authorize.middleware.js';

interface MultipartRequest extends AuthedRequest {
  file?: Express.Multer.File;
}

// ---- Workspace-scoped --------------------------------------------------------

export const listChannels = asyncHandler<AuthedRequest>(async (req, res) => {
  const items = await svc.listChannelsFor(req.params.workspaceId as string, req.user.sub);
  res.json({ items });
});

export const listDms = asyncHandler<AuthedRequest>(async (req, res) => {
  const items = await svc.listDmsFor(req.params.workspaceId as string, req.user.sub);
  res.json({ items });
});

export const createChannel = asyncHandler<AuthedRequest>(async (req, res) => {
  const channel = await svc.createChannel(req.params.workspaceId as string, req.user.sub, req.body);
  res.status(201).json(channel);
});

export const createDm = asyncHandler<AuthedRequest>(async (req, res) => {
  const { userIds } = req.body as { userIds: string[] };
  const channel = await svc.getOrCreateDm(req.params.workspaceId as string, [
    req.user.sub,
    ...userIds,
  ]);
  res.status(201).json(channel);
});

export const unread = asyncHandler<AuthedRequest>(async (req, res) => {
  const result = await svc.unreadCounts(req.params.workspaceId as string, req.user.sub);
  res.json(result);
});

export const search = asyncHandler<AuthedRequest>(async (req, res) => {
  const q = String(req.query.q ?? '');
  const result = await svc.searchMessages(req.params.workspaceId as string, req.user.sub, q);
  res.json(result);
});

export const recent = asyncHandler<AuthedRequest>(async (req, res) => {
  const result = await svc.listRecentMessages(req.params.workspaceId as string, req.user.sub);
  res.json(result);
});

export const listThreads = asyncHandler<AuthedRequest>(async (req, res) => {
  const result = await svc.listUserThreads(req.params.workspaceId as string, req.user.sub, {
    before: req.query.before ? String(req.query.before) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json(result);
});

// ---- Channel-scoped ----------------------------------------------------------

export const getChannel = asyncHandler<ChannelRequest>(async (req, res) => {
  const channel = await svc.getChannel(String(req.channel._id), req.user.sub);
  res.json(channel);
});

export const updateChannel = asyncHandler<ChannelRequest>(async (req, res) => {
  const channel = await svc.updateChannel(String(req.channel._id), req.body, req.user.sub);
  res.json(channel);
});

export const addMembers = asyncHandler<ChannelRequest>(async (req, res) => {
  const { userIds } = req.body as { userIds: string[] };
  const channel = await svc.addMembers(String(req.channel._id), userIds, req.user.sub);
  res.json(channel);
});

export const joinChannel = asyncHandler<ChannelRequest>(async (req, res) => {
  const channel = await svc.joinChannel(String(req.channel._id), req.user.sub);
  res.json(channel);
});

export const leaveChannel = asyncHandler<ChannelRequest>(async (req, res) => {
  await svc.leaveChannel(String(req.channel._id), req.user.sub);
  res.status(204).end();
});

export const markRead = asyncHandler<ChannelRequest>(async (req, res) => {
  await svc.markRead(String(req.channel._id), req.user.sub);
  res.status(204).end();
});

export const listMessages = asyncHandler<ChannelRequest>(async (req, res) => {
  const result = await svc.listMessages(String(req.channel._id), {
    before: req.query.before ? String(req.query.before) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json(result);
});

export const sendMessage = asyncHandler<ChannelRequest>(async (req, res) => {
  const message = await svc.sendMessage(String(req.channel._id), req.user.sub, req.body);
  res.status(201).json(message);
});

export const presignUpload = asyncHandler<ChannelRequest>(async (req, res) => {
  const { name, mimeType } = req.body as { name: string; mimeType: string };
  const presigned = await svc.presignUpload(String(req.channel._id), { name, mimeType });
  if (!presigned) {
    // Provider has no presign (local disk) — client should use the multipart relay.
    res.json({ presigned: false });
    return;
  }
  res.json({ presigned: true, ...presigned });
});

export const uploadAttachment = asyncHandler<MultipartRequest>(async (req, res) => {
  if (!req.file) throw BadRequest('file is required (field name: "file")');
  // Multer decodes the multipart filename as latin1; re-decode as UTF-8 so names
  // with non-ASCII characters (e.g. a narrow no-break space) aren't mojibaked.
  const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const attachment = await svc.storeUpload(req.params.id as string, {
    buffer: req.file.buffer,
    originalname,
    mimetype: req.file.mimetype,
  });
  res.status(201).json(attachment);
});

export const listPins = asyncHandler<ChannelRequest>(async (req, res) => {
  const items = await svc.listPins(String(req.channel._id));
  res.json({ items });
});

// ---- Message-scoped ----------------------------------------------------------

export const editMessage = asyncHandler<AuthedRequest>(async (req, res) => {
  const { body, mentions } = req.body as { body: string; mentions?: string[] };
  const message = await svc.editMessage(req.params.id as string, req.user.sub, body, mentions);
  res.json(message);
});

export const deleteMessage = asyncHandler<AuthedRequest>(async (req, res) => {
  await svc.deleteMessage(req.params.id as string, req.user.sub);
  res.status(204).end();
});

export const react = asyncHandler<AuthedRequest>(async (req, res) => {
  const { emoji } = req.body as { emoji: string };
  const message = await svc.toggleReaction(req.params.id as string, req.user.sub, emoji);
  res.json(message);
});

export const pin = asyncHandler<AuthedRequest>(async (req, res) => {
  const message = await svc.setPinned(req.params.id as string, req.user.sub, true);
  res.json(message);
});

export const unpin = asyncHandler<AuthedRequest>(async (req, res) => {
  const message = await svc.setPinned(req.params.id as string, req.user.sub, false);
  res.json(message);
});

export const replies = asyncHandler<AuthedRequest>(async (req: Request & AuthedRequest, res) => {
  const result = await svc.listReplies(req.params.id as string, req.user.sub);
  res.json(result);
});
