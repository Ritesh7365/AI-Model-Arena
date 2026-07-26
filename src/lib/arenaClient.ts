/**
 * Shared Axios client for Arena n8n webhooks.
 * Provides a common baseURL, timeout, JSON headers, and error normalization.
 */
import axios, { AxiosError, AxiosInstance, isAxiosError } from 'axios';
import { AppError } from '../utils/AppError';

const ARENA_BASE_URL = 'http://localhost:5678';

/**
 * Per-model webhook timeout.
 * Under parallel Ollama load, slower models (e.g. Llama) can exceed 5 minutes.
 */
export const ARENA_TIMEOUT_MS = 900_000;

/**
 * Creates the Arena HTTP client used by model and judge services.
 */
const createArenaClient = (): AxiosInstance => {
  console.log('[ArenaClient] Axios configuration', {
    baseURL: ARENA_BASE_URL,
    timeout: ARENA_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  const client = axios.create({
    baseURL: ARENA_BASE_URL,
    timeout: ARENA_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    validateStatus: (status) => status >= 200 && status < 300,
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (!isAxiosError(error)) {
        return Promise.reject(error);
      }

      return Promise.reject(toArenaHttpError(error));
    },
  );

  return client;
};

/** Maps Axios failures into operational AppError instances with useful messages. */
const toArenaHttpError = (error: AxiosError): AppError => {
  const url = error.config?.url ?? 'unknown';
  const status = error.response?.status;

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new AppError(
      `Arena webhook timed out after ${error.config?.timeout ?? ARENA_TIMEOUT_MS}ms (${url})`,
      504,
      error.response?.data,
    );
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ERR_NETWORK') {
    return new AppError(
      `Unable to reach Arena webhook at ${ARENA_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`,
      503,
      error.response?.data,
    );
  }

  if (status) {
    return new AppError(
      `Arena webhook returned HTTP ${status} for ${url}`,
      status,
      error.response?.data,
    );
  }

  return new AppError(error.message || 'Arena webhook request failed', 500, error.response?.data);
};

/** Shared Axios instance for all Arena model/judge webhook calls. */
export const arenaClient: AxiosInstance = createArenaClient();

/**
 * Extracts a string `output` from heterogeneous n8n webhook payloads.
 */
export const extractOutputString = (data: unknown): string => {
  if (typeof data === 'string') {
    return data;
  }

  if (data !== null && typeof data === 'object' && 'output' in data) {
    const value = (data as { output: unknown }).output;
    if (typeof value === 'string') {
      return value;
    }
    if (value === undefined || value === null) {
      return '';
    }
    return JSON.stringify(value);
  }

  if (data === undefined || data === null) {
    return '';
  }

  return JSON.stringify(data);
};
