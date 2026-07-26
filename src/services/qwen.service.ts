/**
 * Qwen model worker service.
 * Calls POST /webhook/model-qwen and returns { model, output }.
 */
import type { AxiosInstance } from 'axios';
import { arenaClient, extractOutputString } from '../lib/arenaClient';
import type { ModelResponse } from '../types/arena.types';

const WEBHOOK_PATH = '/webhook/model-qwen';

export class QwenService {
  constructor(private readonly http: AxiosInstance = arenaClient) {}

  /** Sends the prompt to the Qwen n8n webhook. */
  async compare(prompt: string): Promise<ModelResponse> {
    console.log('[Qwen] Model started');
    const startedAt = Date.now();

    const { data } = await this.http.post<unknown>(WEBHOOK_PATH, { prompt });
    const result: ModelResponse = {
      model: 'Qwen',
      output: extractOutputString(data),
    };

    console.log(`[Qwen] Model finished (${Date.now() - startedAt}ms)`);
    return result;
  }
}

/** Default Qwen service instance. */
export const qwenService = new QwenService();
