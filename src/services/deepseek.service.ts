/**
 * DeepSeek model worker service.
 * Calls POST /webhook/model-deepseek and returns { model, output }.
 */
import type { AxiosInstance } from 'axios';
import { arenaClient, extractOutputString } from '../lib/arenaClient';
import type { ModelResponse } from '../types/arena.types';

const WEBHOOK_PATH = '/webhook/model-deepseek';

export class DeepSeekService {
  constructor(private readonly http: AxiosInstance = arenaClient) {}

  /** Sends the prompt to the DeepSeek n8n webhook. */
  async compare(prompt: string): Promise<ModelResponse> {
    console.log('[DeepSeek] Model started');
    const startedAt = Date.now();

    const { data } = await this.http.post<unknown>(WEBHOOK_PATH, { prompt });
    const result: ModelResponse = {
      model: 'DeepSeek',
      output: extractOutputString(data),
    };

    console.log(`[DeepSeek] Model finished (${Date.now() - startedAt}ms)`);
    return result;
  }
}

/** Default DeepSeek service instance. */
export const deepseekService = new DeepSeekService();
