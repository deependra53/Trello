import { z } from 'zod';
import { objectIdSchema } from './workspace.validator.js';

export const createCardSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(20000).default(''),
  position: z.number().optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(500).trim().optional(),
  description: z.string().max(20000).optional(),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  dueComplete: z.boolean().optional(),
  cover: z
    .object({
      type: z.enum(['color', 'image', 'attachment']),
      value: z.string(),
      size: z.enum(['normal', 'full']).optional(),
      brightness: z.enum(['light', 'dark']).optional(),
    })
    .nullable()
    .optional(),
  customFieldValues: z.record(z.string(), z.unknown()).optional(),
  archived: z.boolean().optional(),
});

export const moveCardSchema = z
  .object({
    listId: objectIdSchema,
    prevId: objectIdSchema.nullable().optional(),
    nextId: objectIdSchema.nullable().optional(),
    clientEventId: z.string().min(1).max(64),
  })
  .refine((v) => !v.prevId || !v.nextId || v.prevId !== v.nextId, {
    message: 'prevId and nextId must differ',
    path: ['prevId'],
  });

export const copyCardSchema = z.object({
  title: z.string().min(1).max(500).trim().optional(),
  listId: objectIdSchema.optional(),
  keepChecklists: z.boolean().default(true),
  keepLabels: z.boolean().default(true),
  keepMembers: z.boolean().default(false),
});

export const mirrorCardSchema = z.object({
  listId: objectIdSchema,
});

export const addCardMemberSchema = z.object({
  userId: objectIdSchema,
});

export const addCardLabelSchema = z.object({
  labelId: objectIdSchema,
});

export const checklistSchema = z.object({
  title: z.string().min(1).max(200),
  position: z.number().optional(),
});

export const updateChecklistSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  position: z.number().optional(),
});

export const checklistItemSchema = z.object({
  text: z.string().min(1).max(500),
  memberId: objectIdSchema.optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateChecklistItemSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  memberId: objectIdSchema.nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  position: z.number().optional(),
});
