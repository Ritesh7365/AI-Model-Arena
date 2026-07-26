/**
 * Zod schemas for chat-related request payloads.
 * Kept ready for the upcoming n8n integration.
 */
import { z } from 'zod';

/** Validates POST /api/chat request body. */
export const chatRequestSchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(10000),
  modelIds: z.array(z.string().min(1)).min(1).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
