/**
 * Shared TypeScript types and interfaces for the application.
 */
import type { NextFunction, Request, Response } from 'express';

/** Standard async Express route handler signature. */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

/** Shape of a successful API response envelope. */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

/** Shape of a failed API response envelope. */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}
