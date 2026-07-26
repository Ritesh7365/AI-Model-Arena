/**
 * Async handler utility.
 * Wraps async route handlers so rejected promises are forwarded to Express error middleware.
 */
import type { NextFunction, Request, Response } from 'express';
import type { AsyncRequestHandler } from '../types';

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
