/**
 * Chat controller.
 * Receives HTTP input, delegates to the chat service, and shapes the response.
 */
import type { Request, Response } from 'express';
import { ChatService, chatService as defaultChatService } from '../services/chat.service';
import type { ChatRequest } from '../validators/chat.validator';

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** POST /api/chat — runs Model Arena and returns the comparison payload. */
  createChat = async (req: Request, res: Response): Promise<void> => {
    console.log('[ChatController] Request received');
    console.log('[ChatController] Request body:', req.body);

    const payload = req.body as ChatRequest;
    const result = await this.chatService.processChat(payload);

    console.log('[ChatController] Final response ready');
    console.log('[ChatController] Final response:', {
      success: result.success,
      winner: (result.data as { winner?: string } | undefined)?.winner,
      modelCount: Array.isArray((result.data as { models?: unknown[] })?.models)
        ? (result.data as { models: unknown[] }).models.length
        : undefined,
    });

    res.status(200).json(result);
  };
}

/** Default controller instance used by chat routes. */
export const chatController = new ChatController(defaultChatService);
