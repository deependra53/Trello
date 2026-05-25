import { Router } from 'express';
import * as ctrl from '../controllers/card.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireCardAccess } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  updateCardSchema,
  moveCardSchema,
  copyCardSchema,
  mirrorCardSchema,
  addCardMemberSchema,
  addCardLabelSchema,
  checklistSchema,
  updateChecklistSchema,
  checklistItemSchema,
  updateChecklistItemSchema,
} from '../validators/card.validator.js';
import { commentSchema, updateCommentSchema, reactionSchema } from '../validators/misc.validator.js';
import multer from 'multer';
import * as uploadCtrl from '../controllers/upload.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();
router.use(requireAuth);

router.get('/:id', requireCardAccess('admin', 'member', 'observer'), ctrl.get);
router.patch('/:id', requireCardAccess('admin', 'member'), validate(updateCardSchema), ctrl.update);
router.delete('/:id', requireCardAccess('admin', 'member'), ctrl.remove);
router.post(
  '/:id/move',
  requireCardAccess('admin', 'member'),
  validate(moveCardSchema),
  ctrl.move,
);
router.post(
  '/:id/copy',
  requireCardAccess('admin', 'member'),
  validate(copyCardSchema),
  ctrl.copy,
);
router.post('/:id/archive', requireCardAccess('admin', 'member'), ctrl.archive);
router.post(
  '/:id/mirror',
  requireCardAccess('admin', 'member'),
  validate(mirrorCardSchema),
  ctrl.mirror,
);

// Members & labels
router.post(
  '/:id/members',
  requireCardAccess('admin', 'member'),
  validate(addCardMemberSchema),
  ctrl.toggleMember,
);
router.post(
  '/:id/labels',
  requireCardAccess('admin', 'member'),
  validate(addCardLabelSchema),
  ctrl.toggleLabel,
);
router.post('/:id/watch', requireCardAccess('admin', 'member', 'observer'), ctrl.watch);
router.post('/:id/vote', requireCardAccess('admin', 'member', 'observer'), ctrl.vote);

// Checklists
router.post(
  '/:id/checklists',
  requireCardAccess('admin', 'member'),
  validate(checklistSchema),
  ctrl.addChecklist,
);
router.patch(
  '/:cardId/checklists/:checklistId',
  requireCardAccess('admin', 'member'),
  validate(updateChecklistSchema),
  ctrl.updateChecklist,
);
router.delete(
  '/:cardId/checklists/:checklistId',
  requireCardAccess('admin', 'member'),
  ctrl.deleteChecklist,
);
router.post(
  '/:cardId/checklists/:checklistId/items',
  requireCardAccess('admin', 'member'),
  validate(checklistItemSchema),
  ctrl.addChecklistItem,
);
router.patch(
  '/:cardId/checklist-items/:itemId',
  requireCardAccess('admin', 'member'),
  validate(updateChecklistItemSchema),
  ctrl.updateChecklistItem,
);
router.delete(
  '/:cardId/checklist-items/:itemId',
  requireCardAccess('admin', 'member'),
  ctrl.deleteChecklistItem,
);

// Comments
router.get('/:id/comments', requireCardAccess('admin', 'member', 'observer'), ctrl.listComments);
router.post(
  '/:id/comments',
  requireCardAccess('admin', 'member'),
  validate(commentSchema),
  ctrl.addComment,
);
router.patch(
  '/:cardId/comments/:commentId',
  requireCardAccess('admin', 'member'),
  validate(updateCommentSchema),
  ctrl.updateComment,
);
router.delete(
  '/:cardId/comments/:commentId',
  requireCardAccess('admin', 'member'),
  ctrl.deleteComment,
);
router.post(
  '/:cardId/comments/:commentId/reactions',
  requireCardAccess('admin', 'member', 'observer'),
  validate(reactionSchema),
  ctrl.reactToComment,
);

// Attachments
router.post(
  '/:id/attachments',
  requireCardAccess('admin', 'member'),
  upload.single('file'),
  uploadCtrl.upload,
);
router.delete(
  '/:cardId/attachments/:attachmentId',
  requireCardAccess('admin', 'member'),
  uploadCtrl.remove,
);
router.post(
  '/:cardId/attachments/:attachmentId/cover',
  requireCardAccess('admin', 'member'),
  uploadCtrl.setCover,
);

export default router;
