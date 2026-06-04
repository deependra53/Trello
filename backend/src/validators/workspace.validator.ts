import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  description: z.string().max(500).default(''),
  visibility: z.enum(['private', 'public']).default('private'),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
  description: z.string().max(500).optional(),
  visibility: z.enum(['private', 'public']).optional(),
  logoUrl: z.string().url().optional(),
  settings: z
    .object({
      domainRestriction: z.string().optional(),
      boardCreationRestriction: z.enum(['any', 'admin']).optional(),
      inviteRestriction: z.enum(['any', 'admin']).optional(),
    })
    .optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email().toLowerCase().trim().optional(),
  userId: objectIdSchema.optional(),
  role: z.enum(['admin', 'member', 'guest']).default('member'),
}).refine((v) => v.email || v.userId, { message: 'Provide email or userId' });

export const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'guest']),
});

export const createInviteSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(['admin', 'member', 'guest']).default('member'),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(8),
});
