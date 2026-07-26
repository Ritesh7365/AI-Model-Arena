/**
 * Arena API TypeScript contracts matching the Express backend response.
 */

/** Single model result from the Arena orchestrator. */
export interface ModelResponse {
  model: string;
  output: string;
  executionTime: number;
}

/** Successful comparison payload nested under `data`. */
export interface ArenaResult {
  prompt: string;
  winner: string;
  summary: string;
  totalExecutionTime: number;
  models: ModelResponse[];
}

/** Typed envelope returned by POST /api/chat. */
export interface ArenaResponse {
  success: true;
  data: ArenaResult;
}

/** Error envelope returned by the backend on failure. */
export interface ArenaErrorResponse {
  success: false;
  message: string;
}
