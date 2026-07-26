/**
 * AI Judge service.
 * Calls POST /webhook/judge-models with the prompt and collected model responses.
 */
import type { AxiosInstance } from 'axios';
import { arenaClient } from '../lib/arenaClient';
import type { JudgeRequest, JudgeResponse, ModelResponse } from '../types/arena.types';
import { AppError } from '../utils/AppError';

const WEBHOOK_PATH = '/webhook/judge-models';

export class JudgeService {
  constructor(private readonly http: AxiosInstance = arenaClient) {}

  /**
   * Sends prompt + model responses to the judge webhook and returns parsed JSON.
   */
  async judge(prompt: string, responses: ModelResponse[]): Promise<JudgeResponse> {
    console.log('[Judge] Service starting');
    console.log('[Judge] Request body:', {
      prompt,
      responseCount: responses.length,
      models: responses.map((item) => item.model),
    });

    const startedAt = Date.now();

    try {
      const payload: JudgeRequest = { prompt, responses };
      const { data } = await this.http.post<unknown>(WEBHOOK_PATH, payload);
      const parsed = this.parseJudgeResponse(data);

      console.log(`[Judge] Service completed (${Date.now() - startedAt}ms)`);
      console.log('[Judge] Judge response:', parsed);
      return parsed;
    } catch (error: unknown) {
      console.error('[Judge] Thrown exception:', error);
      throw error;
    }
  }

  /** Ensures the judge payload is valid JSON matching JudgeResponse. */
  private parseJudgeResponse(data: unknown): JudgeResponse {
    const candidate = typeof data === 'string' ? this.parseJsonString(data) : data;

    if (
      candidate === null ||
      typeof candidate !== 'object' ||
      typeof (candidate as JudgeResponse).winner !== 'string' ||
      typeof (candidate as JudgeResponse).summary !== 'string'
    ) {
      throw new AppError('Judge webhook returned invalid JSON payload', 502, candidate);
    }

    return candidate as JudgeResponse;
  }

  private parseJsonString(raw: string): unknown {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      throw new AppError('Judge webhook returned a non-JSON string body', 502, raw);
    }
  }
}

/** Default Judge service instance. */
export const judgeService = new JudgeService();
