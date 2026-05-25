import { Router } from 'express';
import * as ctrl from '../controllers/misc.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  inboxCaptureSchema,
  inboxConvertSchema,
  fromTemplateSchema,
} from '../validators/misc.validator.js';

const router = Router();

// Search
router.get('/search', requireAuth, ctrl.search);

// Notifications
router.get('/notifications', requireAuth, ctrl.notifications);
router.get('/notifications/unread-count', requireAuth, ctrl.unreadCount);
router.patch('/notifications/read-all', requireAuth, ctrl.markAllRead);
router.patch('/notifications/:id/read', requireAuth, ctrl.markRead);

// Inbox
router.get('/inbox', requireAuth, ctrl.inboxList);
router.post('/inbox/capture', requireAuth, validate(inboxCaptureSchema), ctrl.inboxCapture);
router.post(
  '/inbox/:itemId/convert',
  requireAuth,
  validate(inboxConvertSchema),
  ctrl.inboxConvert,
);
router.delete('/inbox/:itemId', requireAuth, ctrl.inboxDelete);

// Templates
router.get('/templates', ctrl.templates);
router.post(
  '/boards/from-template/:templateId',
  requireAuth,
  validate(fromTemplateSchema),
  ctrl.boardFromTemplate,
);

// Planner
router.get('/planner', requireAuth, ctrl.planner);

export default router;
