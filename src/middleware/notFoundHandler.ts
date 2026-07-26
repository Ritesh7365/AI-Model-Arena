/**
 * 404 Not Found middleware.
 * Catches requests that did not match any registered route.
 */
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
