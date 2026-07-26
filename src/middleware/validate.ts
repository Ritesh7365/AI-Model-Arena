/**
 * Request validation middleware factory.
 * Validates req.body against a Zod schema before the controller runs.
 */
import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    console.log('[Validate] Request received');
    console.log('[Validate] Request body:', req.body);

    try {
      req.body = schema.parse(req.body);
      console.log('[Validate] Validation passed:', req.body);
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        console.error('[Validate] Zod validation failed:', error.flatten().fieldErrors);
      } else {
        console.error('[Validate] Thrown exception:', error);
      }
      next(error);
    }
  };
};
