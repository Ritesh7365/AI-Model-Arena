/**
 * Chat service.
 * Orchestrates chat requests and delegates comparison work to ModelArenaService.
 */
import type { ChatRequest } from '../validators/chat.validator';
import {
  ModelArenaService,
  modelArenaService as defaultModelArenaService,
} from './modelArena.service';

export interface ChatSuccessResponse {
  success: true;
  data: unknown;
}

export class ChatService {
  constructor(private readonly modelArenaService: ModelArenaService) {}

  /**
   * Processes a chat request by running parallel model webhooks and the judge workflow.
   */
  async processChat(payload: ChatRequest): Promise<ChatSuccessResponse> {
    console.log('[ChatService] Service starting');
    console.log('[ChatService] Request body/payload:', payload);

    try {
      const data = await this.modelArenaService.compareAll(payload.prompt);
      console.log('[ChatService] Service completed');
      return { success: true, data };
    } catch (error: unknown) {
      console.error('[ChatService] Thrown exception:', error);
      throw error;
    }
  }
}

/** Default chat service instance wired with the Model Arena orchestrator. */
export const chatService = new ChatService(defaultModelArenaService);
