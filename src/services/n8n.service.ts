/**
 * n8n integration service.
 * Calls the external AI comparison workflow via the environment-selected webhook.
 *
 * Environment selection logic (no hardcoded URLs):
 * - NODE_ENV === "development" → N8N_TEST_WEBHOOK_URL (n8n "Listen for Test Event")
 * - otherwise                  → N8N_PRODUCTION_WEBHOOK_URL (n8n Production webhook)
 *
 * Diagnosis notes:
 * - Long multi-model workflows often exceed short Axios timeouts. The previous 120s
 *   timeout caused ECONNABORTED while n8n was still running, which was incorrectly
 *   remapped to "Unable to connect to AI Engine". Real Axios errors are preserved.
 */
import axios, { AxiosError, AxiosInstance, AxiosResponse, isAxiosError } from 'axios';
import { env, isDevelopment } from '../config/env';
import { AppError } from '../utils/AppError';

/** 5 minutes — multi-model + judge workflows need headroom during debugging. */
const N8N_TIMEOUT_MS = 300_000;

export type N8nWebhookType = 'TEST' | 'PRODUCTION';

export interface N8nWebhookConfig {
  environment: string;
  webhookType: N8nWebhookType;
  webhookUrl: string;
}

type IntegrationStep =
  | 'Backend Started'
  | 'URL Valid'
  | 'Request Sent'
  | 'Webhook Connected'
  | 'Response Received';

/**
 * Resolves which n8n webhook to use from validated env vars.
 * Centralized so URL selection stays out of controllers and routes.
 */
export const resolveN8nWebhookConfig = (
  nodeEnv: string = env.NODE_ENV,
  testUrl: string = env.N8N_TEST_WEBHOOK_URL,
  productionUrl: string = env.N8N_PRODUCTION_WEBHOOK_URL,
): N8nWebhookConfig => {
  // Development always targets the Test webhook so local "Listen for Test Event" works.
  // Any non-development environment (production, test, etc.) uses the Production webhook.
  const useTestWebhook = nodeEnv === 'development';

  return {
    environment: nodeEnv,
    webhookType: useTestWebhook ? 'TEST' : 'PRODUCTION',
    webhookUrl: useTestWebhook ? testUrl : productionUrl,
  };
};

/** Throws immediately when a webhook URL cannot be parsed / is not http(s). */
export const assertValidWebhookUrl = (url: string): void => {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    console.error(`Invalid n8n webhook URL (malformed): ${url}`);
    throw new AppError(`Invalid n8n webhook URL (malformed): ${url}`, 500);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    console.error(`Invalid n8n webhook URL (unsupported protocol): ${url}`);
    throw new AppError(`Invalid n8n webhook URL (unsupported protocol): ${url}`, 500);
  }
};

export class N8nService {
  private readonly http: AxiosInstance;
  private readonly webhookConfig: N8nWebhookConfig;

  constructor(webhookConfig?: N8nWebhookConfig, httpClient?: AxiosInstance) {
    // Inject config for tests/DI; default resolves from NODE_ENV + env webhook URLs.
    this.webhookConfig = webhookConfig ?? resolveN8nWebhookConfig();
    assertValidWebhookUrl(this.webhookConfig.webhookUrl);

    this.http =
      httpClient ??
      axios.create({
        timeout: N8N_TIMEOUT_MS,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        // Keep default JSON transform; empty bodies are validated explicitly below.
        validateStatus: (status) => status >= 200 && status < 300,
      });
  }

  /** Active webhook URL selected for the current environment. */
  get webhookUrl(): string {
    return this.webhookConfig.webhookUrl;
  }

  /** TEST or PRODUCTION label for the active webhook. */
  get webhookType(): N8nWebhookType {
    return this.webhookConfig.webhookType;
  }

  /**
   * Prints the AI Engine webhook configuration at process startup.
   * Helps operators confirm which n8n endpoint the API will call.
   */
  logConfiguration(): void {
    const { environment, webhookType, webhookUrl } = this.webhookConfig;

    console.log('===========================');
    console.log('AI Engine Configuration');
    console.log(`Environment : ${environment}`);
    console.log(`Webhook Type : ${webhookType}`);
    console.log(`Webhook URL  : ${webhookUrl}`);
    console.log(`Timeout MS   : ${N8N_TIMEOUT_MS}`);
    console.log('===========================');
  }

  /**
   * Sends a prompt to the selected n8n compare-models webhook and returns its response body.
   * Awaits the Axios promise fully so Respond-to-Webhook payloads are not dropped.
   */
  async compareModels(prompt: string): Promise<unknown> {
    const completed: IntegrationStep[] = ['Backend Started'];
    const requestBody = { prompt };

    try {
      assertValidWebhookUrl(this.webhookUrl);
      completed.push('URL Valid');

      this.logRequest(requestBody);
      completed.push('Request Sent');

      // Await the full round-trip — do not fire-and-forget.
      const response: AxiosResponse<unknown> = await this.http.post(
        this.webhookUrl,
        requestBody,
      );

      completed.push('Webhook Connected');
      this.logResponse(response);
      completed.push('Response Received');

      const payload = this.validateAndNormalizePayload(response.data);
      this.printIntegrationReport({ ok: true, completed });
      return payload;
    } catch (error: unknown) {
      const diagnosis = this.diagnoseError(error);
      this.logAxiosError(error, diagnosis);

      const failedAt = this.inferFailedStep(error, completed);
      this.printIntegrationReport({
        ok: false,
        completed,
        failedAt,
        reason: diagnosis.reason,
        recommendedFix: diagnosis.recommendedFix,
      });

      // Preserve the real Axios / transport error — do not remap to a generic message.
      if (isAxiosError(error)) {
        throw this.toAppErrorFromAxios(error, diagnosis.reason);
      }

      throw error;
    }
  }

  /** Ensures Respond-to-Webhook payloads (including `{ output: "..." }`) are returned intact. */
  private validateAndNormalizePayload(data: unknown): unknown {
    if (data === undefined || data === null || data === '') {
      throw new AppError('n8n returned an empty response body', 502);
    }

    // Axios may leave a JSON string unparsed if Content-Type was missing/wrong.
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (!trimmed) {
        throw new AppError('n8n returned an empty response body', 502);
      }

      try {
        return JSON.parse(trimmed) as unknown;
      } catch {
        // Non-JSON text is still a valid webhook body — return as-is (do not discard).
        if (isDevelopment) {
          console.warn('n8n response was not valid JSON; returning raw string body.');
        }
        return data;
      }
    }

    // Objects such as `{ output: "..." }` or structured judge JSON pass through unchanged.
    return data;
  }

  private logRequest(body: unknown): void {
    if (!isDevelopment) {
      return;
    }

    console.log('==============================');
    console.log('N8N REQUEST');
    console.log('URL');
    console.log(this.webhookUrl);
    console.log('Request Body');
    console.log(body);
    console.log('==============================');
  }

  private logResponse(response: AxiosResponse<unknown>): void {
    if (!isDevelopment) {
      return;
    }

    console.log('==============================');
    console.log('N8N RESPONSE');
    console.log('Status Code');
    console.log(response.status);
    console.log('Headers');
    console.log(response.headers);
    console.log('Body');
    console.log(response.data);
    console.log('==============================');
  }

  private logAxiosError(error: unknown, diagnosis: { category: string; reason: string }): void {
    if (!isDevelopment) {
      return;
    }

    const axiosError = isAxiosError(error) ? error : undefined;

    console.log('==============================');
    console.log('AXIOS ERROR');
    console.log('category');
    console.log(diagnosis.category);
    console.log('error.code');
    console.log(axiosError?.code);
    console.log('error.message');
    console.log(axiosError?.message ?? (error instanceof Error ? error.message : String(error)));
    console.log('error.stack');
    console.log(axiosError?.stack ?? (error instanceof Error ? error.stack : undefined));
    console.log('');
    console.log('response.status');
    console.log(axiosError?.response?.status);
    console.log('');
    console.log('response.headers');
    console.log(axiosError?.response?.headers);
    console.log('');
    console.log('response.data');
    console.log(axiosError?.response?.data);
    console.log('');
    console.log('request URL');
    console.log(axiosError?.config?.url ?? this.webhookUrl);
    console.log('');
    console.log('timeout');
    console.log(axiosError?.config?.timeout ?? N8N_TIMEOUT_MS);
    console.log('==============================');
  }

  private diagnoseError(error: unknown): {
    category: string;
    reason: string;
    recommendedFix: string;
  } {
    if (!isAxiosError(error)) {
      return {
        category: 'unknown',
        reason: error instanceof Error ? error.message : String(error),
        recommendedFix: 'Inspect the stack trace and n8n execution log for the failing node.',
      };
    }

    const status = error.response?.status;
    const code = error.code;

    if (code === 'ECONNREFUSED') {
      return {
        category: 'connection refused',
        reason: `Connection refused when calling ${this.webhookUrl}`,
        recommendedFix: 'Ensure n8n is running and reachable on the configured host/port.',
      };
    }

    if (code === 'ENOTFOUND') {
      return {
        category: 'network error',
        reason: `DNS lookup failed for webhook host (${this.webhookUrl})`,
        recommendedFix: 'Verify N8N_*_WEBHOOK_URL hostnames in .env.',
      };
    }

    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return {
        category: 'timeout',
        reason: `Axios timed out after ${error.config?.timeout ?? N8N_TIMEOUT_MS}ms waiting for n8n`,
        recommendedFix:
          'Increase timeout further if needed, or speed up the n8n workflow (models + AI Judge). Confirm Respond to Webhook finally executes.',
      };
    }

    if (code === 'ERR_NETWORK' || code === 'ECONNRESET') {
      return {
        category: 'network error',
        reason: `Network error (${code}) while waiting for n8n response`,
        recommendedFix: 'Check Docker/network stability between the API and n8n containers/host.',
      };
    }

    if (status === 404) {
      return {
        category: '404',
        reason: 'n8n returned HTTP 404 for the webhook path',
        recommendedFix:
          'Confirm the workflow is active and the path is compare-models. In development, use webhook-test and click Listen for Test Event.',
      };
    }

    if (status === 500) {
      return {
        category: '500',
        reason: 'n8n returned HTTP 500 (workflow execution error)',
        recommendedFix: 'Open the failed execution in n8n and fix the failing node (often AI Judge / model call).',
      };
    }

    if (status === 502) {
      return {
        category: '502',
        reason: 'n8n returned HTTP 502 (bad gateway / upstream failure)',
        recommendedFix: 'Check Ollama/model upstreams used by the workflow.',
      };
    }

    if (status === 504) {
      return {
        category: '504',
        reason: 'n8n returned HTTP 504 (gateway timeout)',
        recommendedFix: 'Reduce workflow latency or raise proxy/gateway timeouts in front of n8n.',
      };
    }

    if (error.message.toLowerCase().includes('json')) {
      return {
        category: 'invalid JSON',
        reason: `Invalid JSON in n8n response: ${error.message}`,
        recommendedFix:
          'Ensure Respond to Webhook returns application/json (AI Judge must emit pure JSON, not markdown).',
      };
    }

    if (!error.response) {
      return {
        category: 'empty response / no response',
        reason: `No HTTP response received from n8n (${error.message})`,
        recommendedFix:
          'n8n likely accepted the webhook but never completed Respond to Webhook before the client gave up.',
      };
    }

    return {
      category: `http ${status ?? 'unknown'}`,
      reason: error.message,
      recommendedFix: 'Inspect AXIOS ERROR response.data and the matching n8n execution.',
    };
  }

  private inferFailedStep(error: unknown, completed: IntegrationStep[]): IntegrationStep {
    if (!completed.includes('URL Valid')) {
      return 'URL Valid';
    }
    if (!completed.includes('Request Sent')) {
      return 'Request Sent';
    }
    if (isAxiosError(error) && error.response) {
      return 'Webhook Connected';
    }
    if (completed.includes('Request Sent') && !completed.includes('Response Received')) {
      return 'Response Received';
    }
    return 'Response Received';
  }

  private toAppErrorFromAxios(error: AxiosError, reason: string): AppError {
    const status = error.response?.status;

    // Map transport failures to 504/503 while preserving the real reason text.
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || status === 504) {
      return new AppError(reason, 504, error.response?.data);
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ERR_NETWORK') {
      return new AppError(reason, 503, error.response?.data);
    }
    if (status === 404) {
      return new AppError(reason, 404, error.response?.data);
    }
    if (status && status >= 400) {
      return new AppError(reason, status, error.response?.data);
    }

    return new AppError(reason, 500, error.response?.data);
  }

  private printIntegrationReport(input: {
    ok: boolean;
    completed: IntegrationStep[];
    failedAt?: IntegrationStep;
    reason?: string;
    recommendedFix?: string;
  }): void {
    if (!isDevelopment) {
      return;
    }

    const allSteps: IntegrationStep[] = [
      'Backend Started',
      'URL Valid',
      'Request Sent',
      'Webhook Connected',
      'Response Received',
    ];

    console.log('==============================');
    console.log('Integration Report');
    console.log('');

    if (input.ok) {
      for (const step of allSteps) {
        console.log(`✓ ${step}`);
      }
    } else {
      for (const step of input.completed) {
        console.log(`✓ ${step}`);
      }
      console.log('');
      console.log('✗ Failed at:');
      console.log(input.failedAt ?? 'unknown');
      console.log('');
      console.log('Reason:');
      console.log(input.reason ?? 'unknown');
      console.log('');
      console.log('Recommended Fix:');
      console.log(input.recommendedFix ?? 'See AXIOS ERROR logs above.');
    }

    console.log('==============================');
  }
}

/** Default n8n service instance used by the application. */
export const n8nService = new N8nService();
