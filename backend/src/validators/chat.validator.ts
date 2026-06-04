import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createChannelSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  description: z.string().max(500).optional(),
  topic: z.string().max(250).optional(),
  isPrivate: z.boolean().default(false),
  memberIds: z.array(objectIdSchema).optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  description: z.string().max(500).optional(),
  topic: z.string().max(250).optional(),
});

export const addChannelMembersSchema = z.object({
  userIds: z.array(objectIdSchema).min(1),
});

export const createDmSchema = z.object({
  userIds: z.array(objectIdSchema).min(1),
});

const attachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  mimeType: z.string().optional(),
  size: z.number().optional(),
});

export const sendMessageSchema = z
  .object({
    body: z.string().max(8000).optional(),
    mentions: z.array(objectIdSchema).optional(),
    attachments: z.array(attachmentSchema).optional(),
    parentId: objectIdSchema.optional(),
    // Client-generated correlation id, echoed back on the response and the socket
    // broadcast so the sender can reconcile its optimistic message instead of
    // rendering a duplicate. Opaque to the server; never persisted.
    clientId: z.string().max(100).optional(),
  })
  .refine((v) => Boolean(v.body && v.body.trim()) || (v.attachments?.length ?? 0) > 0, {
    message: 'Message cannot be empty',
    path: ['body'],
  });

export const editMessageSchema = z.object({
  body: z.string().min(1).max(8000),
  mentions: z.array(objectIdSchema).optional(),
});

export const reactSchema = z.object({
  emoji: z.string().min(1).max(64),
});

export const presignUploadSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
});
