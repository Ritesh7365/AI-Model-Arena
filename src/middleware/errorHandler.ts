/**
 * Centralized Express error-handling middleware.
 * Logs full diagnostics and returns the real error message to the client in development.
 */
import type { NextFunction, Request, Response } from 'express';
import { isAxiosError } from 'axios';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const logFullError = (err: unknown): void => {
  console.error('[ErrorHandler] Thrown exception');
  console.error(err);

  if (err instanceof Error) {
    console.error('[ErrorHandler] error.stack:', err.stack);
    console.error('[ErrorHandler] error.message:', err.message);
  }

  if (isAxiosError(err)) {
    console.error('[ErrorHandler] error.response?.status:', err.response?.status);
    console.error('[ErrorHandler] error.response?.data:', err.response?.data);
    console.error('[ErrorHandler] error.code:', err.code);
    console.error('[ErrorHandler] error.config?.url:', err.config?.url);
  }

  if (err instanceof AppError) {
    console.error('[ErrorHandler] AppError.statusCode:', err.statusCode);
    console.error('[ErrorHandler] AppError.details:', err.details);
  }
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logFullError(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined ? { errors: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    console.error('[ErrorHandler] Zod validation errors:', err.flatten().fieldErrors);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // Preserve real Axios / upstream failures instead of a generic 500 string.
  if (isAxiosError(err)) {
    const status = err.response?.status && err.response.status >= 400 ? err.response.status : 502;
    res.status(status).json({
      success: false,
      message: err.message,
      ...(err.response?.data !== undefined ? { errors: err.response.data } : {}),
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err instanceof Error
          ? err.message
          : String(err),
  });
};
