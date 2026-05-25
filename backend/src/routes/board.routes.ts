import { Router } from 'express';
import * as ctrl from '../controllers/board.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  updateBoardSchema,
  addBoardMemberSchema,
  updateBoardMemberSchema,
  copyBoardSchema,
} from '../validators/board.validator.js';
import { createListSchema } from '../validators/list.validator.js';
import { labelSchema, updateLabelSchema, automationSchema, updateAutomationSchema } from '../validators/misc.validator.js';

const router = Router();
router.use(requireAuth);

router.get('/:id', requireBoardRole('admin', 'member', 'observer'), ctrl.get);
router.patch('/:id', requireBoardRole('admin', 'member'), validate(updateBoardSchema), ctrl.update);
router.delete('/:id', requireBoardRole('admin'), ctrl.remove);
router.post('/:id/star', requireBoardRole('admin', 'member', 'observer'), ctrl.star);
router.post('/:id/close', requireBoardRole('admin'), ctrl.close);
router.post('/:id/copy', requireBoardRole('admin', 'member'), validate(copyBoardSchema), ctrl.copy);

// Members
router.post(
  '/:id/members',
  requireBoardRole('admin'),
  validate(addBoardMemberSchema),
  ctrl.addMember,
);
router.patch(
  '/:id/members/:userId',
  requireBoardRole('admin'),
  validate(updateBoardMemberSchema),
  ctrl.updateMember,
);
router.delete('/:id/members/:userId', requireBoardRole('admin'), ctrl.removeMember);

// Lists
router.get('/:id/lists', requireBoardRole('admin', 'member', 'observer'), ctrl.listLists);
router.post(
  '/:boardId/lists',
  requireBoardRole('admin', 'member'),
  validate(createListSchema),
  ctrl.createList,
);

// Labels
router.get('/:id/labels', requireBoardRole('admin', 'member', 'observer'), ctrl.listLabels);
router.post(
  '/:id/labels',
  requireBoardRole('admin', 'member'),
  validate(labelSchema),
  ctrl.createLabel,
);
router.patch(
  '/:id/labels/:labelId',
  requireBoardRole('admin', 'member'),
  validate(updateLabelSchema),
  ctrl.updateLabel,
);
router.delete('/:id/labels/:labelId', requireBoardRole('admin', 'member'), ctrl.removeLabel);

// Activity
router.get('/:id/activity', requireBoardRole('admin', 'member', 'observer'), ctrl.activity);

// Automations
router.get(
  '/:id/automations',
  requireBoardRole('admin', 'member'),
  ctrl.listAutomations,
);
router.post(
  '/:id/automations',
  requireBoardRole('admin'),
  validate(automationSchema),
  ctrl.createAutomation,
);
router.patch(
  '/:id/automations/:automationId',
  requireBoardRole('admin'),
  validate(updateAutomationSchema),
  ctrl.updateAutomation,
);
router.delete('/:id/automations/:automationId', requireBoardRole('admin'), ctrl.removeAutomation);

export default router;
