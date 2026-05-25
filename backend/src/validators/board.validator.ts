import { z } from 'zod';
import { objectIdSchema } from './workspace.validator.js';

const backgroundSchema = z.object({
  type: z.enum(['color', 'image', 'gradient']),
  value: z.string(),
});

export const createBoardSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).default(''),
  background: backgroundSchema.optional(),
  visibility: z.enum(['private', 'workspace', 'public']).default('workspace'),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional(),
  background: backgroundSchema.optional(),
  visibility: z.enum(['private', 'workspace', 'public']).optional(),
  closed: z.boolean().optional(),
});

export const addBoardMemberSchema = z.object({
  userId: objectIdSchema,
  role: z.enum(['admin', 'member', 'observer']).default('member'),
});

export const updateBoardMemberSchema = z.object({
  role: z.enum(['admin', 'member', 'observer']),
});

export const copyBoardSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  workspaceId: objectIdSchema.optional(),
  keepCards: z.boolean().default(true),
});

export const customFieldSchema = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(['text', 'number', 'date', 'checkbox', 'dropdown']),
  options: z
    .array(z.object({ id: z.string(), value: z.string(), color: z.string().optional() }))
    .default([]),
  showOnFront: z.boolean().default(false),
});
