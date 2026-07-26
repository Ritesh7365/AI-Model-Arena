/**
 * Llama model worker service.
 * Calls POST /webhook/model-llama and returns { model, output }.
 */
import type { AxiosInstance } from 'axios';
import { arenaClient, extractOutputString } from '../lib/arenaClient';
import type { ModelResponse } from '../types/arena.types';

const WEBHOOK_PATH = '/webhook/model-llama';

export class LlamaService {
  constructor(private readonly http: AxiosInstance = arenaClient) {}

  /** Sends the prompt to the Llama n8n webhook. */
  async compare(prompt: string): Promise<ModelResponse> {
    console.log('[Llama] Model started');
    const startedAt = Date.now();

    const { data } = await this.http.post<unknown>(WEBHOOK_PATH, { prompt });
    const result: ModelResponse = {
      model: 'Llama',
      output: extractOutputString(data),
    };

    console.log(`[Llama] Model finished (${Date.now() - startedAt}ms)`);
    return result;
  }
}

/** Default Llama service instance. */
export const llamaService = new LlamaService();
