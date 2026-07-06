import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as systemSettingService from '../services/systemSetting.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getOtpBypass = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const enabled = await systemSettingService.getOtpBypassEnabled();
  sendSuccess(res, { enabled });
});

export const setOtpBypass = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { enabled } = req.body as { enabled: boolean };
  const updated = await systemSettingService.setOtpBypassEnabled(enabled, req.user!.id);
  sendSuccess(res, { enabled: updated.otpBypassEnabled }, enabled ? 'OTP bypass enabled' : 'OTP bypass disabled');
});
