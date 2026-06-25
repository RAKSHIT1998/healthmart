import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import * as authService from '../services/auth.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const requestOtp = asyncHandler(async (req: Request, res: Response) => {
  await authService.requestOtp(req.body);
  sendSuccess(res, null, 'OTP sent successfully');
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens, isNewUser } = await authService.verifyOtpAndAuthenticate(req.body, req);
  sendSuccess(res, { user, tokens, isNewUser }, 'Authenticated successfully');
});

export const staffLogin = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.staffLogin(req.body, req);
  sendSuccess(res, { user, tokens }, 'Logged in successfully');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!refreshToken) throw ApiError.badRequest('Refresh token is required');
  const tokens = await authService.refreshAccessToken(refreshToken, req);
  sendSuccess(res, tokens, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (refreshToken) await authService.logout(refreshToken);
  sendSuccess(res, null, 'Logged out successfully');
});

export const logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await authService.logoutAllDevices(req.user!.id);
  sendSuccess(res, null, 'Logged out from all devices');
});
