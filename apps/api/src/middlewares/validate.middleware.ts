import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

function formatZodError(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

/** Validates req.body / req.query / req.params against zod schemas and replaces them with the parsed (typed, defaulted) values. */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(ApiError.badRequest('Validation failed', formatZodError(err)));
        return;
      }
      next(err);
    }
  };
}
