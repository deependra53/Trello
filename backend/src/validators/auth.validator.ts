import { z } from 'zod';

const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

export const signupSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    password,
    fullName: z.string().min(1).max(120).trim(),
    // When joining via an invite link the org already exists, so the name is optional.
    organizationName: z.string().min(1).max(120).trim().optional(),
    inviteToken: z.string().min(8).optional(),
    // Board invite — joins the board's organization as a guest (boards-only access).
    boardInviteToken: z.string().min(8).optional(),
  })
  .refine(
    (v) => Boolean(v.organizationName) || Boolean(v.inviteToken) || Boolean(v.boardInviteToken),
    {
      message: 'organizationName is required when not joining via an invite',
      path: ['organizationName'],
    },
  );

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(8),
  password,
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(1).max(120).trim().optional(),
    // NOTE: avatarUrl is deliberately NOT accepted here. Avatars can only be set
    // via POST /me/avatar (which validates image type + size and stores through
    // the upload provider). Allowing an arbitrary external URL would let a user
    // point every viewer's browser at a host they control (IP/referrer leak).
    preferences: z
      .object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        language: z.string().min(2).max(10).optional(),
        notifications: z
          .object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
            mentions: z.boolean().optional(),
            cardActivity: z.boolean().optional(),
            dueReminders: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
