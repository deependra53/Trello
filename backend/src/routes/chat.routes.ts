import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole, requireChannelAccess } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createChannelSchema,
  updateChannelSchema,
  addChannelMembersSchema,
  createDmSchema,
  sendMessageSchema,
  editMessageSchema,
  reactSchema,
  presignUploadSchema,
} from '../validators/chat.validator.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();
router.use(requireAuth);

const anyOrgMember = requireWorkspaceRole('owner', 'admin', 'member', 'guest');

// --- Workspace-scoped ---
router.get('/workspaces/:workspaceId/channels', anyOrgMember, ctrl.listChannels);
router.post(
  '/workspaces/:workspaceId/channels',
  anyOrgMember,
  validate(createChannelSchema),
  ctrl.createChannel,
);
router.get('/workspaces/:workspaceId/dms', anyOrgMember, ctrl.listDms);
router.post('/workspaces/:workspaceId/dms', anyOrgMember, validate(createDmSchema), ctrl.createDm);
router.get('/workspaces/:workspaceId/unread', anyOrgMember, ctrl.unread);
router.get('/workspaces/:workspaceId/recent', anyOrgMember, ctrl.recent);
router.get('/workspaces/:workspaceId/search', anyOrgMember, ctrl.search);
router.get('/workspaces/:workspaceId/threads', anyOrgMember, ctrl.listThreads);

// --- Channel-scoped ---
router.get('/channels/:id', requireChannelAccess(), ctrl.getChannel);
router.patch('/channels/:id', requireChannelAccess(), validate(updateChannelSchema), ctrl.updateChannel);
router.get('/channels/:id/messages', requireChannelAccess(), ctrl.listMessages);
router.post('/channels/:id/messages', requireChannelAccess(), validate(sendMessageSchema), ctrl.sendMessage);
router.post(
  '/channels/:id/upload-url',
  requireChannelAccess(),
  validate(presignUploadSchema),
  ctrl.presignUpload,
);
router.post('/channels/:id/upload', requireChannelAccess(), upload.single('file'), ctrl.uploadAttachment);
router.post(
  '/channels/:id/members',
  requireChannelAccess(),
  validate(addChannelMembersSchema),
  ctrl.addMembers,
);
router.post('/channels/:id/join', requireChannelAccess(), ctrl.joinChannel);
router.post('/channels/:id/leave', requireChannelAccess(), ctrl.leaveChannel);
router.post('/channels/:id/read', requireChannelAccess(), ctrl.markRead);
router.get('/channels/:id/pins', requireChannelAccess(), ctrl.listPins);

// --- Message-scoped (access is checked inside the service) ---
router.patch('/messages/:id', validate(editMessageSchema), ctrl.editMessage);
router.delete('/messages/:id', ctrl.deleteMessage);
router.post('/messages/:id/react', validate(reactSchema), ctrl.react);
router.post('/messages/:id/pin', ctrl.pin);
router.delete('/messages/:id/pin', ctrl.unpin);
router.get('/messages/:id/replies', ctrl.replies);

export default router;
