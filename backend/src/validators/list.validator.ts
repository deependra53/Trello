import { z } from 'zod';
import { objectIdSchema } from './workspace.validator.js';

export const createListSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  position: z.number().optional(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  color: z.string().optional(),
  collapsed: z.boolean().optional(),
  archived: z.boolean().optional(),
  sortBy: z.enum(['manual', 'createdAt', 'dueDate', 'title']).optional(),
});

export const moveListSchema = z
  .object({
    prevId: objectIdSchema.nullable().optional(),
    nextId: objectIdSchema.nullable().optional(),
    clientEventId: z.string().min(1).max(64),
  })
  .refine((v) => !v.prevId || !v.nextId || v.prevId !== v.nextId, {
    message: 'prevId and nextId must differ',
    path: ['prevId'],
  });

export const copyListSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
});
