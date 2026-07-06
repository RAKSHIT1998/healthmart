import { SystemSettingModel } from '../models';

const KEY = 'global';

export async function getOtpBypassEnabled(): Promise<boolean> {
  const doc = await SystemSettingModel.findOne({ key: KEY });
  return doc?.otpBypassEnabled ?? false;
}

export async function setOtpBypassEnabled(enabled: boolean, actorId?: string) {
  return SystemSettingModel.findOneAndUpdate(
    { key: KEY },
    { $set: { otpBypassEnabled: enabled, otpBypassUpdatedAt: new Date(), otpBypassUpdatedBy: actorId } },
    { upsert: true, new: true },
  );
}
