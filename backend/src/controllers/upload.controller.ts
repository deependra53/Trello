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
