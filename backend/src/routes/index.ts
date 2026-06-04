import { Router } from 'express';
import authRoutes from './auth.routes.js';
import workspaceRoutes from './workspace.routes.js';
import boardRoutes from './board.routes.js';
import listRoutes from './list.routes.js';
import cardRoutes from './card.routes.js';
import chatRoutes from './chat.routes.js';
import miscRoutes from './misc.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/boards', boardRoutes);
router.use('/lists', listRoutes);
router.use('/cards', cardRoutes);
router.use('/chat', chatRoutes);
router.use('/', miscRoutes);

export default router;
