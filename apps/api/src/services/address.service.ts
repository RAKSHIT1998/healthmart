import type { AddressInput, UpdateAddressInput } from '@buymedicines/shared';
import { addressRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';

export async function listAddresses(userId: string) {
  return addressRepository.listForUser(userId);
}

export async function createAddress(userId: string, input: AddressInput) {
  if (input.isDefault) {
    await addressRepository.clearDefault(userId);
  } else {
    const existing = await addressRepository.listForUser(userId);
    if (existing.length === 0) input.isDefault = true;
  }
  return addressRepository.create({ ...input, userId } as never);
}

export async function updateAddress(userId: string, addressId: string, input: UpdateAddressInput) {
  const address = await addressRepository.findOne({ _id: addressId, userId });
  if (!address) throw ApiError.notFound('Address not found');

  if (input.isDefault) {
    await addressRepository.clearDefault(userId);
  }

  Object.assign(address, input);
  await address.save();
  return address;
}

export async function deleteAddress(userId: string, addressId: string) {
  const address = await addressRepository.findOne({ _id: addressId, userId });
  if (!address) throw ApiError.notFound('Address not found');
  await addressRepository.deleteById(addressId);
}
