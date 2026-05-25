import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthedRequest } from '../middleware/auth.middleware.js';

function ctxOf(req: Request) {
  return { userAgent: req.header('user-agent') ?? undefined, ip: req.ip };
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body as {
    email: string;
    password: string;
    fullName: string;
  };
  const result = await authService.signup(email, password, fullName, ctxOf(req));
  res.status(201).json({
    user: result.user.toJSON(),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
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
