/**
 * Chat routes.
 * Mounts chat endpoints that integrate with the n8n AI workflow.
 */
import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { chatRequestSchema } from '../validators/chat.validator';

const router = Router();

router.post('/', validateBody(chatRequestSchema), asyncHandler(chatController.createChat));

export default router;
