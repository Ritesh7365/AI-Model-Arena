/**
 * Axios API client for the AI Model Arena backend.
 *
 * Calls Express directly on :3000.
 * Uses 127.0.0.1 to avoid Windows localhost/IPv6 resolution quirks.
 */
import axios from "axios";

import type { ArenaResponse } from "@/types/arena";

const BACKEND_ORIGIN = "http://127.0.0.1:3000";

const api = axios.create({
  baseURL: BACKEND_ORIGIN,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // Must exceed worst-case parallel model + judge duration.
  timeout: 1_200_000,
});

/**
 * Lightweight liveness check used before/after long Arena requests.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const { data } = await api.get<{ status: string }>("/health", {
      timeout: 5_000,
    });
    return data?.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Submits a prompt to POST /api/chat and returns the typed Arena response.
 */
export async function compareModels(prompt: string): Promise<ArenaResponse> {
  const { data } = await api.post<ArenaResponse>("/api/chat", { prompt });
  return data;
}
