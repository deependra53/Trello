import bcrypt from 'bcrypt';
import { User, type UserDoc } from '../models/user.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  findRefreshUserId,
  generateOpaqueToken,
  hashToken,
} from './token.service.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';
import { create as createWorkspace } from './workspace.service.js';
import { acceptInvite } from './invite.service.js';
import { acceptInvite as acceptBoardInvite } from './boardInvite.service.js';
import { BadRequest, Conflict, NotFound, Unauthorized } from '../utils/errors.js';
import { Workspace, type WorkspaceDoc } from '../models/workspace.model.js';
import { getUploadProvider } from '../uploads/providers.js';
import type { UpdateProfileInput } from '../validators/auth.validator.js';

const BCRYPT_ROUNDS = 12;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

export interface RequestContext {
  userAgent?: string;
  ip?: string;
}

export interface AuthResult {
  user: UserDoc;
  accessToken: string;
  refreshToken: string;
  workspace?: WorkspaceDoc;
}

export interface SignupOptions {
  organizationName?: string;
  inviteToken?: string;
  boardInviteToken?: string;
}

export async function signup(
  email: string,
  password: string,
  fullName: string,
  ctx: RequestContext,
  opts: SignupOptions = {},
): Promise<AuthResult> {
  const existing = await User.findOne({ email });
  if (existing) throw Conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const verificationToken = generateOpaqueToken(32);
  const user = await User.create({
    email,
    passwordHash,
    fullName,
    emailVerified: false,
    verificationToken: hashToken(verificationToken),
    verificationExpires: new Date(Date.now() + VERIFY_TTL_MS),
  });

  // Send verification — fail silently in dev so signup never blocks
  sendVerificationEmail(email, fullName, verificationToken).catch(() => undefined);

  // Join the inviting org (workspace or board invite), or create a brand-new one.
  let workspace: WorkspaceDoc;
  if (opts.inviteToken) {
    workspace = await acceptInvite(opts.inviteToken, String(user._id));
  } else if (opts.boardInviteToken) {
    // Board invite: join the board (as a member) and its org as a guest — no
    // personal org is created, so the user only sees the board they were added to.
    const { workspaceId } = await acceptBoardInvite(opts.boardInviteToken, String(user._id));
    const ws = await Workspace.findById(workspaceId);
    if (!ws) throw NotFound('Organization not found');
    workspace = ws;
  } else {
    workspace = await createWorkspace(String(user._id), {
      name: opts.organizationName ?? `${fullName}'s Organization`,
    });
  }

  const accessToken = signAccessToken({ sub: String(user._id), email: user.email });
  const refreshToken = await issueRefreshToken({ userId: String(user._id), ...ctx });
  return { user, accessToken, refreshToken, workspace };
}

export async function login(
  email: string,
  password: string,
  ctx: RequestContext,
): Promise<AuthResult> {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw Unauthorized('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw Unauthorized('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken({ sub: String(user._id), email: user.email });
  const refreshToken = await issueRefreshToken({ userId: String(user._id), ...ctx });
  return { user, accessToken, refreshToken };
}

export async function logout(refreshToken: string): Promise<void> {
  await revokeRefreshToken(refreshToken);
}

export async function refresh(
  oldRefreshToken: string,
  ctx: RequestContext,
): Promise<{ accessToken: string; refreshToken: string }> {
  const userId = await findRefreshUserId(oldRefreshToken);
  if (!userId) throw Unauthorized('Invalid refresh token');
  const user = await User.findById(userId);
  if (!user) throw Unauthorized('User not found');

  const newRefresh = await rotateRefreshToken(oldRefreshToken, { userId, ...ctx });
  const accessToken = signAccessToken({ sub: userId, email: user.email });
  return { accessToken, refreshToken: newRefresh };
}

export async function verifyEmail(token: string): Promise<void> {
  const hash = hashToken(token);
  const user = await User.findOne({
    verificationToken: hash,
    verificationExpires: { $gt: new Date() },
  }).select('+verificationToken +verificationExpires');
  if (!user) throw BadRequest('Verification link is invalid or expired');
  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;
  await user.save();
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  // Do not reveal whether user exists
  if (!user) return;
  const rawToken = generateOpaqueToken(32);
  user.resetPasswordToken = hashToken(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();
  sendPasswordResetEmail(user.email, user.fullName, rawToken).catch(() => undefined);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const hash = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hash,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires +passwordHash');
  if (!user) throw BadRequest('Reset link is invalid or expired');
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  // Revoke all refresh tokens for this user
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}

export async function getMe(userId: string): Promise<UserDoc> {
  const user = await User.findById(userId);
  if (!user) throw NotFound('User not found');
  return user;
}

/**
 * Patch the signed-in user's own profile. Only the provided fields change;
 * preferences are merged path-by-path so updating one notification toggle never
 * clobbers the others.
 */
export async function updateProfile(userId: string, patch: UpdateProfileInput): Promise<UserDoc> {
  const user = await User.findById(userId);
  if (!user) throw NotFound('User not found');

  if (patch.fullName !== undefined) user.fullName = patch.fullName;

  if (patch.preferences) {
    const p = patch.preferences;
    if (p.theme !== undefined) user.set('preferences.theme', p.theme);
    if (p.language !== undefined) user.set('preferences.language', p.language);
    if (p.notifications) {
      for (const [key, value] of Object.entries(p.notifications)) {
        if (value !== undefined) user.set(`preferences.notifications.${key}`, value);
      }
    }
  }

  await user.save();
  return user;
}

/**
 * Change the password of a signed-in user (knows their current password). We
 * deliberately do NOT revoke refresh tokens here — that would sign the user out
 * of the very session they're using. The recovery flow (resetPassword) revokes;
 * a voluntary in-session change keeps the session alive.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw NotFound('User not found');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw BadRequest('Current password is incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save();
}

/** Store an uploaded image as the user's avatar and return the updated user. */
export async function updateAvatar(
  userId: string,
  file: { buffer: Buffer; originalName: string; mimeType: string },
): Promise<UserDoc> {
  if (!file.mimeType.startsWith('image/')) throw BadRequest('Avatar must be an image');
  const user = await User.findById(userId);
  if (!user) throw NotFound('User not found');
  const stored = await getUploadProvider().store({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: 'avatars',
  });
  user.avatarUrl = stored.url;
  await user.save();
  return user;
}
