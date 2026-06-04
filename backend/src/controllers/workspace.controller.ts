import * as svc from '../services/workspace.service.js';
import * as boardSvc from '../services/board.service.js';
import * as inviteSvc from '../services/invite.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthedRequest } from '../middleware/auth.middleware.js';
import type { WorkspaceRequest } from '../middleware/authorize.middleware.js';

export const list = asyncHandler<AuthedRequest>(async (req, res) => {
  const items = await svc.listForUser(req.user.sub);
  res.json({ items });
});

export const create = asyncHandler<AuthedRequest>(async (req, res) => {
  const ws = await svc.create(req.user.sub, req.body);
  res.status(201).json(ws);
});

export const get = asyncHandler<WorkspaceRequest>(async (req, res) => {
  res.json(req.workspace);
});

export const update = asyncHandler<WorkspaceRequest>(async (req, res) => {
  const ws = await svc.update(String(req.workspace._id), req.body);
  res.json(ws);
});

export const remove = asyncHandler<WorkspaceRequest>(async (req, res) => {
  await svc.remove(String(req.workspace._id));
  res.status(204).end();
});

export const addMember = asyncHandler<WorkspaceRequest>(async (req, res) => {
  const ws = await svc.addMember(String(req.workspace._id), {
    ...req.body,
    invitedBy: req.user.sub,
  });
  res.status(201).json(ws);
});

export const updateMember = asyncHandler<WorkspaceRequest>(async (req, res) => {
  const ws = await svc.updateMember(
    String(req.workspace._id),
    req.params.userId as string,
    (req.body as { role: 'owner' | 'admin' | 'member' | 'guest' }).role,
  );
  res.json(ws);
});

export const removeMember = asyncHandler<WorkspaceRequest>(async (req, res) => {
  const ws = await svc.removeMember(
    String(req.workspace._id),
    req.params.userId as string,
    req.user.sub,
  );
  res.json(ws);
});

export const listMembers = asyncHandler<WorkspaceRequest>(async (req, res) => {
  const items = await svc.listMembers(String(req.workspace._id));
  res.json({ items });
});

export const listInvites = asyncHandler<WorkspaceRequest>(async (req, res) => {
  const items = await inviteSvc.listInvites(String(req.workspace._id));
  res.json({ items });
});

export const createInvite = asyncHandler<WorkspaceRequest>(async (req, res) => {
  const { email, role } = req.body as { email: string; role: 'admin' | 'member' | 'guest' };
  const { invite } = await inviteSvc.createInvite(
    String(req.workspace._id),
    email,
    role,
    req.user.sub,
  );
  res.status(201).json(invite);
});

export const revokeInvite = asyncHandler<WorkspaceRequest>(async (req, res) => {
  await inviteSvc.revokeInvite(String(req.workspace._id), req.params.inviteId as string);
  res.status(204).end();
});

export const acceptInvite = asyncHandler<AuthedRequest>(async (req, res) => {
  const { token } = req.body as { token: string };
  const ws = await inviteSvc.acceptInvite(token, req.user.sub);
  res.json(ws);
});

export const boards = asyncHandler<WorkspaceRequest>(async (req, res) => {
  // ?scope=writable → only boards the user can add cards to (admin/member),
  // used by the "Add message to board" picker.
  const items =
    req.query.scope === 'writable'
      ? await boardSvc.listWritableForWorkspace(String(req.workspace._id), req.user.sub)
      : await boardSvc.listForWorkspace(String(req.workspace._id), req.user.sub);
  res.json({ items });
});

export const createBoard = asyncHandler<WorkspaceRequest>(async (req, res) => {
  const body = req.body as Omit<Parameters<typeof boardSvc.create>[0], 'workspaceId' | 'creatorId'>;
  const board = await boardSvc.create({
    ...body,
    workspaceId: String(req.workspace._id),
    creatorId: req.user.sub,
  });
  res.status(201).json(board);
});
