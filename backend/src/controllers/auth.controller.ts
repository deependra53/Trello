import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import * as inviteService from '../services/invite.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { BadRequest } from '../utils/errors.js';
import type { AuthedRequest } from '../middleware/auth.middleware.js';
import type { UpdateProfileInput } from '../validators/auth.validator.js';

function ctxOf(req: Request) {
  return { userAgent: req.header('user-agent') ?? undefined, ip: req.ip };
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, organizationName, inviteToken, boardInviteToken } =
    req.body as {
      email: string;
      password: string;
      fullName: string;
      organizationName?: string;
      inviteToken?: string;
      boardInviteToken?: string;
    };
  const result = await authService.signup(email, password, fullName, ctxOf(req), {
    organizationName,
    inviteToken,
    boardInviteToken,
  });
  res.status(201).json({
    user: result.user.toJSON(),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    workspace: result.workspace?.toJSON(),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password, ctxOf(req));
  res.json({
    user: result.user.toJSON(),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (refreshToken) await authService.logout(refreshToken);
  res.status(204).end();
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refresh(refreshToken, ctxOf(req));
  res.json(result);
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body as { token: string };
  await authService.verifyEmail(token);
  res.json({ ok: true });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  await authService.forgotPassword(email);
  // Always 200 to prevent user enumeration
  res.json({ ok: true });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  await authService.resetPassword(token, password);
  res.json({ ok: true });
});

export const me = asyncHandler<AuthedRequest>(async (req, res) => {
  const user = await authService.getMe(req.user.sub);
  res.json({ user: user.toJSON() });
});

export const updateMe = asyncHandler<AuthedRequest>(async (req, res) => {
  const user = await authService.updateProfile(req.user.sub, req.body as UpdateProfileInput);
  res.json({ user: user.toJSON() });
});

export const changePassword = asyncHandler<AuthedRequest>(async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  await authService.changePassword(req.user.sub, currentPassword, newPassword);
  res.json({ ok: true });
});

interface AvatarRequest extends AuthedRequest {
  file?: Express.Multer.File;
}

export const updateAvatar = asyncHandler<AvatarRequest>(async (req, res) => {
  if (!req.file) throw BadRequest('file is required (field name: "file")');
  // Multer decodes the multipart filename as latin1; re-decode as UTF-8 so names
  // with non-ASCII characters aren't mojibaked (matches the chat upload path).
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const user = await authService.updateAvatar(req.user.sub, {
    buffer: req.file.buffer,
    originalName,
    mimeType: req.file.mimetype,
  });
  res.json({ user: user.toJSON() });
});

export const inviteInfo = asyncHandler(async (req: Request, res: Response) => {
  const preview = await inviteService.previewInvite(req.params.token as string);
  if (!preview) {
    res.status(404).json({ valid: false });
    return;
  }
  res.json({ valid: true, ...preview });
});
