/**
 * Environment configuration.
 * Loads and validates process.env via Zod so the app fails fast on misconfiguration.
 *
 * n8n webhooks:
 * - Prefer N8N_TEST_WEBHOOK_URL / N8N_PRODUCTION_WEBHOOK_URL.
 * - Legacy N8N_WEBHOOK_URL remains supported as a fallback for both (backward compatibility).
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    /** n8n Test (Listening) webhook — used when NODE_ENV === "development". */
    N8N_TEST_WEBHOOK_URL: z.string().url().optional(),
    /** n8n Production webhook — used when NODE_ENV !== "development". */
    N8N_PRODUCTION_WEBHOOK_URL: z.string().url().optional(),
    /**
     * @deprecated Prefer N8N_TEST_WEBHOOK_URL / N8N_PRODUCTION_WEBHOOK_URL.
     * Kept so existing deployments that only set N8N_WEBHOOK_URL keep working.
     */
    N8N_WEBHOOK_URL: z.string().url().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.N8N_TEST_WEBHOOK_URL && !data.N8N_WEBHOOK_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['N8N_TEST_WEBHOOK_URL'],
        message: 'N8N_TEST_WEBHOOK_URL is required (or set legacy N8N_WEBHOOK_URL)',
      });
    }

    if (!data.N8N_PRODUCTION_WEBHOOK_URL && !data.N8N_WEBHOOK_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['N8N_PRODUCTION_WEBHOOK_URL'],
        message: 'N8N_PRODUCTION_WEBHOOK_URL is required (or set legacy N8N_WEBHOOK_URL)',
      });
    }
  })
  .transform((data) => {
    const N8N_TEST_WEBHOOK_URL = data.N8N_TEST_WEBHOOK_URL ?? data.N8N_WEBHOOK_URL!;
    const N8N_PRODUCTION_WEBHOOK_URL =
      data.N8N_PRODUCTION_WEBHOOK_URL ?? data.N8N_WEBHOOK_URL!;

    return {
      NODE_ENV: data.NODE_ENV,
      PORT: data.PORT,
      DATABASE_URL: data.DATABASE_URL,
      CORS_ORIGIN: data.CORS_ORIGIN,
      N8N_TEST_WEBHOOK_URL,
      N8N_PRODUCTION_WEBHOOK_URL,
      /** Active webhook URL for the current NODE_ENV (legacy-compatible alias). */
      N8N_WEBHOOK_URL:
        data.NODE_ENV === 'development' ? N8N_TEST_WEBHOOK_URL : N8N_PRODUCTION_WEBHOOK_URL,
    };
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

/** Validated application environment variables. */
export const env = parsed.data;

/** Whether the process is running in development mode. */
export const isDevelopment = env.NODE_ENV === 'development';
