import { z } from 'zod';
import { objectIdSchema } from './workspace.validator.js';

export const labelSchema = z.object({
  name: z.string().max(80).default(''),
  color: z.string().min(1),
});

export const updateLabelSchema = labelSchema.partial();

export const commentSchema = z.object({
  body: z.string().min(1).max(20000),
  mentions: z.array(objectIdSchema).default([]),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(20000),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(16),
});

export const inboxCaptureSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(20000).default(''),
});

export const inboxConvertSchema = z.object({
  boardId: objectIdSchema,
  listId: objectIdSchema,
});

export const fromTemplateSchema = z.object({
  workspaceId: objectIdSchema,
  title: z.string().min(1).max(200),
});

export const automationSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).default(''),
  trigger: z.object({
    type: z.string(),
    config: z.record(z.string(), z.unknown()).default({}),
  }),
  conditions: z
    .array(
      z.object({
        field: z.string(),
        op: z.enum(['eq', 'neq', 'in', 'nin', 'gt', 'lt', 'contains', 'exists']),
        value: z.unknown().optional(),
      }),
    )
    .default([]),
  conditionMatch: z.enum(['all', 'any']).default('all'),
  actions: z
    .array(
      z.object({
        type: z.string(),
        config: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .min(1),
  enabled: z.boolean().default(true),
});

export const updateAutomationSchema = automationSchema.partial();
