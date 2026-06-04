import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import {
  signupSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), ctrl.signup);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/logout', ctrl.logout);
router.post('/refresh', validate(refreshSchema), ctrl.refresh);
router.post('/verify-email', validate(verifyEmailSchema), ctrl.verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), ctrl.resetPassword);
router.get('/me', requireAuth, ctrl.me);
router.patch('/me', requireAuth, validate(updateProfileSchema), ctrl.updateMe);
router.post('/me/avatar', requireAuth, avatarUpload.single('file'), ctrl.updateAvatar);
router.post(
  '/change-password',
  requireAuth,
  authLimiter,
  validate(changePasswordSchema),
  ctrl.changePassword,
);
router.get('/invite/:token', ctrl.inviteInfo);

export default router;
