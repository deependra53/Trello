import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { RefreshToken } from '../models/refreshToken.model.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function generateOpaqueToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

interface IssueRefreshOpts {
  userId: string;
  userAgent?: string;
  ip?: string;
}

function refreshExpiryDate(): Date {
  const value = env.JWT_REFRESH_EXPIRES; // e.g. "30d"
  const match = /^(\d+)([smhdw])$/.exec(value);
  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  const n = Number(match[1]);
  const unit = match[2];
  const mult: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return new Date(Date.now() + n * (mult[unit as string] ?? 86_400_000));
}

export async function issueRefreshToken(opts: IssueRefreshOpts): Promise<string> {
  const token = generateOpaqueToken();
  await RefreshToken.create({
    userId: opts.userId,
    tokenHash: hashToken(token),
    userAgent: opts.userAgent,
    ip: opts.ip,
    expiresAt: refreshExpiryDate(),
  });
  return token;
}

export async function rotateRefreshToken(
  oldToken: string,
  opts: IssueRefreshOpts,
): Promise<string> {
  const oldHash = hashToken(oldToken);
  const record = await RefreshToken.findOne({ tokenHash: oldHash });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new Error('Invalid refresh token');
  }
  const newToken = await issueRefreshToken(opts);
  record.revokedAt = new Date();
  record.replacedBy = hashToken(newToken);
  await record.save();
  return newToken;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const hash = hashToken(token);
  await RefreshToken.updateOne({ tokenHash: hash }, { $set: { revokedAt: new Date() } });
}

export async function findRefreshUserId(token: string): Promise<string | null> {
  const hash = hashToken(token);
  const record = await RefreshToken.findOne({ tokenHash: hash });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
  return String(record.userId);
}
