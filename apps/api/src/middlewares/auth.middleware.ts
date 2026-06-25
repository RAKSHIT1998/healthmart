import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@healthmart/shared';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import { UserModel } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
    branchId?: string;
    tokenVersion: number;
  };
}

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized('Authentication token missing');
    }

    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub).select('role isActive tokenVersion branchId');

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account not found or deactivated');
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw ApiError.unauthorized('Session expired, please log in again');
    }

    req.user = {
      id: String(user._id),
      role: user.role as Role,
      branchId: user.branchId ? String(user.branchId) : undefined,
      tokenVersion: user.tokenVersion,
    };
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
      return;
    }
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/** Authenticates if a token is present, but does not fail the request when absent. */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  await authenticate(req, _res, next);
}
