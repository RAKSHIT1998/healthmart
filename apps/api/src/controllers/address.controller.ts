import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as addressService from '../services/address.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const addresses = await addressService.listAddresses(req.user!.id);
  sendSuccess(res, addresses);
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const address = await addressService.createAddress(req.user!.id, req.body);
  sendSuccess(res, address, 'Address added', 201);
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const address = await addressService.updateAddress(req.user!.id, req.params.id as string, req.body);
  sendSuccess(res, address, 'Address updated');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await addressService.deleteAddress(req.user!.id, req.params.id as string);
  sendSuccess(res, null, 'Address removed');
});
