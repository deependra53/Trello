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
} from '../validators/workspace.validator.js';
import { createBoardSchema } from '../validators/board.validator.js';

const router = Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', validate(createWorkspaceSchema), ctrl.create);

router.get('/:id', requireWorkspaceRole('owner', 'admin', 'member', 'guest'), ctrl.get);
router.patch(
  '/:id',
  requireWorkspaceRole('owner', 'admin'),
  validate(updateWorkspaceSchema),
  ctrl.update,
);
router.delete('/:id', requireWorkspaceRole('owner'), ctrl.remove);

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

router.get('/:id/boards', requireWorkspaceRole('owner', 'admin', 'member', 'guest'), ctrl.boards);
router.post(
  '/:id/boards',
  requireWorkspaceRole('owner', 'admin', 'member'),
  validate(createBoardSchema),
  ctrl.createBoard,
);

export default router;
