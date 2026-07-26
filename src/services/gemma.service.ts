/**
 * Gemma model worker service.
 * Calls POST /webhook/model-gemma and returns { model, output }.
 */
import type { AxiosInstance } from 'axios';
import { arenaClient, extractOutputString } from '../lib/arenaClient';
import type { ModelResponse } from '../types/arena.types';

const WEBHOOK_PATH = '/webhook/model-gemma';

export class GemmaService {
  constructor(private readonly http: AxiosInstance = arenaClient) {}

  /** Sends the prompt to the Gemma n8n webhook. */
  async compare(prompt: string): Promise<ModelResponse> {
    console.log('[Gemma] Model started');
    const startedAt = Date.now();

    const { data } = await this.http.post<unknown>(WEBHOOK_PATH, { prompt });
    const result: ModelResponse = {
      model: 'Gemma',
      output: extractOutputString(data),
    };

    console.log(`[Gemma] Model finished (${Date.now() - startedAt}ms)`);
    return result;
  }
}

/** Default Gemma service instance. */
export const gemmaService = new GemmaService();
