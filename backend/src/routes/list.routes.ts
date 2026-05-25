import { Router } from 'express';
import * as ctrl from '../controllers/list.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireListAccess } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  updateListSchema,
  moveListSchema,
  copyListSchema,
} from '../validators/list.validator.js';
import { createCardSchema } from '../validators/card.validator.js';

const router = Router();
router.use(requireAuth);

router.patch('/:id', requireListAccess('admin', 'member'), validate(updateListSchema), ctrl.update);
router.delete('/:id', requireListAccess('admin', 'member'), ctrl.remove);
router.post('/:id/move', requireListAccess('admin', 'member'), validate(moveListSchema), ctrl.move);
router.post('/:id/archive', requireListAccess('admin', 'member'), ctrl.archive);
router.post('/:id/copy', requireListAccess('admin', 'member'), validate(copyListSchema), ctrl.copy);

router.post(
  '/:listId/cards',
  requireListAccess('admin', 'member'),
  validate(createCardSchema),
  ctrl.createCard,
);

export default router;
