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
import { BadRequest, Conflict, NotFound, Unauthorized } from '../utils/errors.js';

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
}

export async function signup(
  email: string,
  password: string,
  fullName: string,
  ctx: RequestContext,
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

  const accessToken = signAccessToken({ sub: String(user._id), email: user.email });
  const refreshToken = await issueRefreshToken({ userId: String(user._id), ...ctx });
  return { user, accessToken, refreshToken };
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
