import { Role, type CreateDriverInput } from '@healthmart/shared';
import { driverRepository, orderRepository, userRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/hash';

export async function createDriver(input: CreateDriverInput) {
  const existingUser = await userRepository.findByPhone(input.phone);
  const user =
    existingUser ??
    (await userRepository.create({
      name: input.name,
      phone: input.phone,
      email: input.email,
      role: Role.DELIVERY_BOY,
      branchId: input.branchId,
      passwordHash: await hashPassword(input.phone + '@MMS'),
      isPhoneVerified: true,
    } as never));

  if (existingUser && existingUser.role !== Role.DELIVERY_BOY) {
    existingUser.role = Role.DELIVERY_BOY;
    existingUser.branchId = input.branchId as never;
    await existingUser.save();
  }

  const existingDriver = await driverRepository.findByUserId(String(user._id));
  if (existingDriver) throw ApiError.conflict('This user is already registered as a driver');

  return driverRepository.create({
    userId: user._id,
    branchId: input.branchId,
    vehicleType: input.vehicleType,
    vehicleNumber: input.vehicleNumber,
  } as never);
}

export async function listAvailableDrivers(branchId: string) {
  return driverRepository.listAvailable(branchId);
}

export async function updateAvailability(userId: string, isAvailable: boolean) {
  const driver = await driverRepository.findByUserId(userId);
  if (!driver) throw ApiError.notFound('Driver profile not found');
  driver.isAvailable = isAvailable;
  await driver.save();
  return driver;
}

export async function updateLocation(userId: string, lat: number, lng: number) {
  const driver = await driverRepository.findByUserId(userId);
  if (!driver) throw ApiError.notFound('Driver profile not found');
  return driverRepository.updateLocation(String(driver._id), lat, lng);
}

export async function getAssignedOrders(userId: string, page: number, limit: number) {
  const driver = await driverRepository.findByUserId(userId);
  if (!driver) throw ApiError.notFound('Driver profile not found');
  return orderRepository.listForDriver(String(driver._id), { page, limit });
}
