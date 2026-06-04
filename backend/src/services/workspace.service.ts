import { Types } from 'mongoose';
import { Workspace } from '../models/workspace.model.js';
import { User } from '../models/user.model.js';
import { Board } from '../models/board.model.js';
import { BadRequest, Conflict, NotFound } from '../utils/errors.js';
import { uniqueSlug } from '../utils/slug.js';
import { logActivity } from './activity.service.js';

interface CreateInput {
  name: string;
  description?: string;
  visibility?: 'private' | 'public';
}

export async function listForUser(userId: string) {
  return Workspace.find({
    archived: false,
    $or: [{ ownerId: userId }, { 'members.userId': userId }],
  })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function create(userId: string, input: CreateInput) {
  const ws = await Workspace.create({
    name: input.name,
    slug: uniqueSlug(input.name),
    description: input.description ?? '',
    visibility: input.visibility ?? 'private',
    ownerId: userId,
    members: [{ userId, role: 'owner', joinedAt: new Date() }],
  });
  return ws;
}

export async function getById(id: string) {
  const ws = await Workspace.findById(id);
  if (!ws) throw NotFound('Workspace not found');
  return ws;
}

export async function listMembers(workspaceId: string) {
  const ws = await Workspace.findById(workspaceId).lean();
  if (!ws) throw NotFound('Workspace not found');
  const memberIds = (ws.members ?? []).map((m) => String(m.userId));
  const users = memberIds.length
    ? await User.find({ _id: { $in: memberIds } })
        .select('fullName email avatarUrl')
        .lean()
    : [];
  const profileById = new Map(
    users.map((u) => [
      String(u._id),
      { _id: String(u._id), fullName: u.fullName, email: u.email, avatarUrl: u.avatarUrl },
    ]),
  );
  return (ws.members ?? []).map((m) => ({
    userId: String(m.userId),
    role: m.role,
    joinedAt: m.joinedAt,
    profile: profileById.get(String(m.userId)),
  }));
}

export async function update(id: string, patch: Partial<CreateInput> & { logoUrl?: string }) {
  const ws = await Workspace.findByIdAndUpdate(id, { $set: patch }, { new: true });
  if (!ws) throw NotFound('Workspace not found');
  return ws;
}

export async function remove(id: string) {
  const boards = await Board.countDocuments({ workspaceId: id });
  if (boards > 0) {
    await Board.updateMany({ workspaceId: id }, { $set: { closed: true } });
  }
  await Workspace.findByIdAndDelete(id);
}

interface AddMemberInput {
  email?: string;
  userId?: string;
  role: 'admin' | 'member' | 'guest';
  invitedBy: string;
}

export async function addMember(workspaceId: string, input: AddMemberInput) {
  const ws = await getById(workspaceId);
  let userId = input.userId;
  if (!userId && input.email) {
    const u = await User.findOne({ email: input.email });
    if (!u) throw NotFound('User with that email not found — they must sign up first');
    userId = String(u._id);
  }
  if (!userId) throw BadRequest('userId or email required');
  if (ws.members?.some((m) => String(m.userId) === userId)) {
    throw Conflict('User is already a member');
  }
  ws.members?.push({
    userId: new Types.ObjectId(userId),
    role: input.role,
    invitedBy: new Types.ObjectId(input.invitedBy),
    joinedAt: new Date(),
  });
  await ws.save();
  return ws;
}

export async function updateMember(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' | 'guest',
) {
  const ws = await getById(workspaceId);
  const m = ws.members?.find((mm) => String(mm.userId) === userId);
  if (!m) throw NotFound('Member not found');
  if (role === 'owner') {
    ws.ownerId = new Types.ObjectId(userId);
  }
  m.role = role;
  await ws.save();
  return ws;
}

export async function removeMember(workspaceId: string, userId: string, actorId: string) {
  const ws = await getById(workspaceId);
  if (String(ws.ownerId) === userId) {
    throw BadRequest('Cannot remove the workspace owner');
  }
  await Workspace.updateOne(
    { _id: workspaceId },
    { $pull: { members: { userId: new Types.ObjectId(userId) } } },
  );
  await logActivity({
    boardId: ws._id,
    actorId,
    type: 'workspace.member.removed',
    payload: { userId },
  });
  return getById(workspaceId);
}
