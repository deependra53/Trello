import { Router } from 'express';
import * as ctrl from '../controllers/workspace.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  updateMemberSchema,
  createInviteSchema,
  acceptInviteSchema,
} from '../validators/workspace.validator.js';
import { createBoardSchema } from '../validators/board.validator.js';

const router = Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', validate(createWorkspaceSchema), ctrl.create);

// Any authenticated user can accept an invite they were sent (defined before /:id).
router.post('/accept-invite', validate(acceptInviteSchema), ctrl.acceptInvite);

router.get('/:id', requireWorkspaceRole('owner', 'admin', 'member', 'guest'), ctrl.get);
router.patch(
  '/:id',
  requireWorkspaceRole('owner', 'admin'),
  validate(updateWorkspaceSchema),
  ctrl.update,
);
router.delete('/:id', requireWorkspaceRole('owner'), ctrl.remove);

router.get(
  '/:id/members',
  requireWorkspaceRole('owner', 'admin', 'member', 'guest'),
  ctrl.listMembers,
);
router.post(
  '/:id/members',
  requireWorkspaceRole('owner', 'admin'),
  validate(addMemberSchema),
  ctrl.addMember,
);
router.patch(
  '/:id/members/:userId',
  requireWorkspaceRole('owner'),
  validate(updateMemberSchema),
  ctrl.updateMember,
);
router.delete('/:id/members/:userId', requireWorkspaceRole('owner', 'admin'), ctrl.removeMember);

router.get('/:id/invites', requireWorkspaceRole('owner', 'admin'), ctrl.listInvites);
router.post(
  '/:id/invites',
  requireWorkspaceRole('owner', 'admin'),
  validate(createInviteSchema),
  ctrl.createInvite,
);
router.delete('/:id/invites/:inviteId', requireWorkspaceRole('owner', 'admin'), ctrl.revokeInvite);

router.get('/:id/boards', requireWorkspaceRole('owner', 'admin', 'member', 'guest'), ctrl.boards);
router.post(
  '/:id/boards',
  requireWorkspaceRole('owner', 'admin', 'member'),
  validate(createBoardSchema),
  ctrl.createBoard,
);

export default router;
