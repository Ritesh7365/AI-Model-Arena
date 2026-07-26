/**
 * Route aggregator.
 * Composes feature routers and mounts them under their base paths.
 */
import { Router } from 'express';
import chatRoutes from './chat.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/api/chat', chatRoutes);

export default router;
