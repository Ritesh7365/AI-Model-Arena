/**
 * Model Arena orchestrator.
 * Runs five model webhooks in parallel, measures timings, then calls the judge workflow.
 *
 * Uses per-model isolation: one slow/failed model (e.g. Llama timeout under Ollama load)
 * must not cancel the other completed model results.
 */
import { AppError } from '../utils/AppError';
import type {
  ArenaResponse,
  ModelResponse,
  ModelTimedResponse,
} from '../types/arena.types';
import {
  DeepSeekService,
  deepseekService as defaultDeepSeekService,
} from './deepseek.service';
import {
  GemmaService,
  gemmaService as defaultGemmaService,
} from './gemma.service';
import { JudgeService, judgeService as defaultJudgeService } from './judge.service';
import {
  LlamaService,
  llamaService as defaultLlamaService,
} from './llama.service';
import {
  MistralService,
  mistralService as defaultMistralService,
} from './mistral.service';
import {
  QwenService,
  qwenService as defaultQwenService,
} from './qwen.service';

const isUnavailableOutput = (output: string): boolean =>
  output.startsWith('[Unavailable]');

export class ModelArenaService {
  constructor(
    private readonly llamaService: LlamaService = defaultLlamaService,
    private readonly gemmaService: GemmaService = defaultGemmaService,
    private readonly qwenService: QwenService = defaultQwenService,
    private readonly deepseekService: DeepSeekService = defaultDeepSeekService,
    private readonly mistralService: MistralService = defaultMistralService,
    private readonly judgeService: JudgeService = defaultJudgeService,
  ) {}

  /**
   * Compares a prompt across all models concurrently, then evaluates the winner.
   */
  async compareAll(prompt: string): Promise<ArenaResponse> {
    console.log('[ModelArena] Service starting');
    console.log('[ModelArena] Request body/prompt:', { prompt });

    const totalStartedAt = Date.now();

    try {
      console.log('[ModelArena] Parallel model runs starting (isolated failures)');

      // Each runTimed never rejects — timeouts/failures become [Unavailable] outputs.
      const models: ModelTimedResponse[] = await Promise.all([
        this.runTimed('Llama', this.llamaService, prompt),
        this.runTimed('Gemma', this.gemmaService, prompt),
        this.runTimed('Qwen', this.qwenService, prompt),
        this.runTimed('DeepSeek', this.deepseekService, prompt),
        this.runTimed('Mistral', this.mistralService, prompt),
      ]);

      const successful = models.filter((model) => !isUnavailableOutput(model.output));
      console.log(
        `[ModelArena] Models settled — success=${successful.length}/${models.length}`,
      );

      if (successful.length === 0) {
        throw new AppError('All model webhooks failed or timed out', 504);
      }

      const modelsPhaseMs = Date.now() - totalStartedAt;
      console.log(`[ModelArena] Models complete — totalExecutionTime=${modelsPhaseMs}ms`);

      // Judge only on models that actually produced output.
      const responses: ModelResponse[] = successful.map(({ model, output }) => ({
        model,
        output,
      }));

      console.log('[ModelArena] Judge service starting');
      const judgment = await this.judgeService.judge(prompt, responses);
      console.log('[ModelArena] Judge response:', judgment);

      const result: ArenaResponse = {
        prompt,
        winner: judgment.winner,
        summary: judgment.summary,
        totalExecutionTime: Date.now() - totalStartedAt,
        models,
      };

      console.log('[ModelArena] Service completed / final response prepared');
      return result;
    } catch (error: unknown) {
      console.error('[ModelArena] Thrown exception:', error);
      throw error;
    }
  }

  /**
   * Runs one model service with timing.
   * Never throws — converts failures into an [Unavailable] model result.
   */
  private async runTimed(
    modelName: string,
    service: { compare: (prompt: string) => Promise<ModelResponse> },
    prompt: string,
  ): Promise<ModelTimedResponse> {
    const startedAt = Date.now();

    try {
      const result = await service.compare(prompt);
      const executionTime = Date.now() - startedAt;

      console.log(`[ModelArena] Execution time — ${result.model}: ${executionTime}ms`);
      console.log(`[ModelArena] ${result.model} completed`);

      return {
        ...result,
        executionTime,
      };
    } catch (error: unknown) {
      const executionTime = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : String(error);

      console.error(`[ModelArena] ${modelName} failed after ${executionTime}ms:`, message);

      return {
        model: modelName,
        output: `[Unavailable] ${message}`,
        executionTime,
      };
    }
  }
}

/** Default Model Arena orchestrator instance. */
export const modelArenaService = new ModelArenaService();
