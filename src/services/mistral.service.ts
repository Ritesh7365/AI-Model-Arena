/**
 * Mistral model worker service.
 * Calls POST /webhook/model-mistral and returns { model, output }.
 */
import type { AxiosInstance } from 'axios';
import { arenaClient, extractOutputString } from '../lib/arenaClient';
import type { ModelResponse } from '../types/arena.types';

const WEBHOOK_PATH = '/webhook/model-mistral';

export class MistralService {
  constructor(private readonly http: AxiosInstance = arenaClient) {}

  /** Sends the prompt to the Mistral n8n webhook. */
  async compare(prompt: string): Promise<ModelResponse> {
    console.log('[Mistral] Model started');
    const startedAt = Date.now();

    const { data } = await this.http.post<unknown>(WEBHOOK_PATH, { prompt });
    const result: ModelResponse = {
      model: 'Mistral',
      output: extractOutputString(data),
    };

    console.log(`[Mistral] Model finished (${Date.now() - startedAt}ms)`);
    return result;
  }
}

/** Default Mistral service instance. */
export const mistralService = new MistralService();
