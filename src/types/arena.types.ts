/**
 * Shared Arena domain types for model workers, judge, and orchestration responses.
 */

/** Normalized result from a single model webhook. */
export interface ModelResponse {
  model: string;
  output: string;
}

/** Model result including wall-clock execution time in milliseconds. */
export interface ModelTimedResponse extends ModelResponse {
  executionTime: number;
}

/** Per-model scoring block returned by the AI Judge workflow. */
export interface JudgeModelScore {
  name: string;
  accuracy: number;
  completeness: number;
  clarity: number;
  reasoning: number;
  overall: number;
  strengths: string[];
  weaknesses: string[];
}

/** Parsed JSON body from the judge-models webhook. */
export interface JudgeResponse {
  winner: string;
  summary: string;
  models?: JudgeModelScore[];
}

/** Final Arena orchestration payload returned to callers. */
export interface ArenaResponse {
  prompt: string;
  winner: string;
  summary: string;
  totalExecutionTime: number;
  models: ModelTimedResponse[];
}

/** Payload sent to the judge-models webhook. */
export interface JudgeRequest {
  prompt: string;
  responses: ModelResponse[];
}
