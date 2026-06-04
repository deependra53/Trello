import { Types } from 'mongoose';
import { Invite, type InviteDoc, type InviteRole } from '../models/invite.model.js';
import { Workspace, type WorkspaceDoc } from '../models/workspace.model.js';
import { User } from '../models/user.model.js';
import { generateOpaqueToken, hashToken } from './token.service.js';
import { sendInviteEmail } from './email.service.js';
import { BadRequest, Conflict, NotFound } from '../utils/errors.js';
import { env } from '../config/env.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create (or refresh) a pending invite for an email and send the invite link.
 * Returns the invite plus the raw token (the hash is what's persisted).
 */
export async function createInvite(
  workspaceId: string,
  email: string,
  role: InviteRole,
  inviterId: string,
): Promise<{ invite: InviteDoc; token: string }> {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) throw NotFound('Organization not found');

  const existingUser = await User.findOne({ email });
  if (existingUser && ws.members?.some((m) => String(m.userId) === String(existingUser._id))) {
    throw Conflict('That person is already a member of this organization');
  }

  const token = generateOpaqueToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await Invite.findOneAndUpdate(
    { workspaceId, email, status: 'pending' },
    {
      $set: { role, tokenHash, invitedBy: new Types.ObjectId(inviterId), expiresAt, status: 'pending' },
      $setOnInsert: { workspaceId: new Types.ObjectId(workspaceId), email },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const url = `${env.APP_URL}/signup?invite=${token}`;
  sendInviteEmail(email, ws.name, url).catch(() => undefined);

  return { invite: invite as InviteDoc, token };
}

export async function listInvites(workspaceId: string) {
  return Invite.find({ workspaceId, status: 'pending' }).sort({ createdAt: -1 }).lean();
}

export async function revokeInvite(workspaceId: string, inviteId: string): Promise<void> {
  await Invite.updateOne(
    { _id: inviteId, workspaceId },
    { $set: { status: 'revoked' } },
  );
}

export async function findValidInvite(token: string): Promise<InviteDoc | null> {
  const tokenHash = hashToken(token);
  const invite = await Invite.findOne({ tokenHash, status: 'pending' });
  if (!invite || invite.expiresAt.getTime() < Date.now()) return null;
  return invite;
}

/** Look up an invite's organization name for display on the signup page (no auth). */
export async function previewInvite(token: string): Promise<{ organizationName: string; email: string } | null> {
  const invite = await findValidInvite(token);
  if (!invite) return null;
  const ws = await Workspace.findById(invite.workspaceId).select('name').lean();
  if (!ws) return null;
  return { organizationName: ws.name, email: invite.email };
}

/**
 * Add the user to the invited organization and mark the invite accepted.
 * Safe to call when the user is already a member (no-op membership-wise).
 */
export async function acceptInvite(token: string, userId: string): Promise<WorkspaceDoc> {
  const invite = await findValidInvite(token);
  if (!invite) throw BadRequest('This invite is invalid or has expired');

  const ws = await Workspace.findById(invite.workspaceId);
  if (!ws) throw NotFound('Organization not found');

  const already = ws.members?.some((m) => String(m.userId) === userId);
  if (!already) {
    ws.members?.push({
      userId: new Types.ObjectId(userId),
      role: invite.role,
      invitedBy: invite.invitedBy,
      joinedAt: new Date(),
    });
    await ws.save();
  }

  invite.status = 'accepted';
  await invite.save();
  return ws;
}
