/**
 * Client hook that drives Arena comparisons against the Express backend.
 */
"use client";

import { useCallback, useState } from "react";
import { isAxiosError } from "axios";

import { checkBackendHealth, compareModels } from "@/services/api";
import type { ArenaResult } from "@/types/arena";

interface UseArenaReturn {
  loading: boolean;
  error: string | null;
  result: ArenaResult | null;
  compare: (prompt: string) => Promise<void>;
}

/**
 * Manages loading / error / result state for model arena comparisons.
 */
export function useArena(): UseArenaReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ArenaResult | null>(null);

  const compare = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const healthy = await checkBackendHealth();
      if (!healthy) {
        throw new Error(
          "Backend is not reachable on port 3000. Start it with: npm run dev (project root).",
        );
      }

      const response = await compareModels(prompt);

      if (!response.success) {
        throw new Error("Comparison failed");
      }

      setResult(response.data);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (!err.response) {
          // Chrome often reports ERR_NETWORK_IO_SUSPENDED after sleep / background tabs
          // during long Arena runs — backend may still be fine.
          const backendStillUp = await checkBackendHealth();

          if (err.code === "ECONNABORTED") {
            setError("Request timed out while comparing models. Please try again.");
          } else if (backendStillUp) {
            setError(
              "Connection was interrupted (browser tab sleep/network suspend). Keep this tab open and focused, then try again.",
            );
          } else {
            setError(
              "Network Error — could not reach the API. Is the backend running on port 3000?",
            );
          }
        } else {
          const message =
            (err.response.data as { message?: string } | undefined)?.message ??
            err.message;
          setError(message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while comparing models");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, result, compare };
}
