/**
 * Health controller.
 * Handles liveness/readiness checks for load balancers and monitoring.
 */
import type { Request, Response } from 'express';

/** GET /health — returns a simple OK status payload. */
export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok' });
};
