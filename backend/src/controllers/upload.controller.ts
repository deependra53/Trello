import type { Request } from 'express';
import * as svc from '../services/attachment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { BoardRequest } from '../middleware/authorize.middleware.js';
import { BadRequest } from '../utils/errors.js';

interface MultipartRequest extends BoardRequest {
  file?: Express.Multer.File;
}

export const upload = asyncHandler<MultipartRequest>(async (req, res) => {
  if (!req.file) throw BadRequest('file is required (field name: "file")');
  const att = await svc.addAttachment(
    req.params.id as string,
    {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    },
    req.user.sub,
  );
  res.status(201).json(att);
});

export const remove = asyncHandler<BoardRequest>(async (req, res) => {
  await svc.removeAttachment(
    req.params.cardId as string,
    req.params.attachmentId as string,
    req.user.sub,
  );
  res.status(204).end();
});

export const setCover = asyncHandler<BoardRequest>(async (req, res) => {
  const card = await svc.setCover(
    req.params.cardId as string,
    req.params.attachmentId as string,
    req.user.sub,
  );
  res.json(card);
});

export const sign = asyncHandler(async (_req: Request, res) => {
  // For local provider, the client just POSTs multipart to /api/cards/:id/attachments.
  // Cloudinary/S3 signed-URL flows are wired here when those providers are configured.
  res.json({
    provider: 'local',
    method: 'POST',
    note: 'POST multipart to /api/cards/:id/attachments with field "file".',
  });
});

export const presignCardAttachment = asyncHandler<BoardRequest>(async (req, res) => {
  const { name, mimeType } = req.body as { name?: string; mimeType?: string };
  if (!name || !mimeType) throw BadRequest('name and mimeType are required');
  const presigned = await svc.presignAttachment(req.params.id as string, { name, mimeType });
  if (!presigned) {
    res.json({ provider: 'local', method: 'POST' });
    return;
  }
  res.json(presigned);
});

export const registerCardAttachment = asyncHandler<BoardRequest>(async (req, res) => {
  const { name, url, key, mimeType, size } = req.body as {
    name?: string;
    url?: string;
    key?: string;
    mimeType?: string;
    size?: number;
  };
  if (!name || !url) throw BadRequest('name and url are required');
  const att = await svc.registerAttachment(
    req.params.id as string,
    { name, url, key, mimeType, size },
    req.user.sub,
  );
  res.status(201).json(att);
});
