import type { NextFunction, Response } from 'express';
import { Role } from '@healthmart/shared';
import { ApiError } from '../utils/ApiError';
import type { AuthenticatedRequest } from './auth.middleware';

/** Restricts a route to the given roles. Must run after `authenticate`. */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}

export const requireStaff = requireRole(
  Role.ADMIN,
  Role.MANAGER,
  Role.PHARMACIST,
  Role.INVENTORY_MANAGER,
  Role.DELIVERY_BOY,
);

export const requireAdminOrManager = requireRole(Role.ADMIN, Role.MANAGER);
