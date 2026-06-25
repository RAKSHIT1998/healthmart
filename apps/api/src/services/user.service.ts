import { Role, type CreateStaffUserInput, type PaginationQuery } from '@healthmart/shared';
import { userRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/hash';

export async function createStaffUser(input: CreateStaffUserInput) {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const passwordHash = await hashPassword(input.password);
  return userRepository.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role: input.role,
    branchId: input.branchId,
    isEmailVerified: true,
    isPhoneVerified: true,
  } as never);
}

export async function listStaff(pagination: PaginationQuery) {
  return userRepository.paginate(
    { role: { $in: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST, Role.INVENTORY_MANAGER, Role.DELIVERY_BOY] } },
    { page: pagination.page, limit: pagination.limit },
  );
}

export async function listCustomers(pagination: PaginationQuery, search?: string) {
  return userRepository.paginate(
    {
      role: Role.CUSTOMER,
      ...(search ? { $text: { $search: search } } : {}),
    },
    { page: pagination.page, limit: pagination.limit },
  );
}

export async function deactivateUser(userId: string) {
  const user = await userRepository.updateById(userId, { isActive: false });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function reactivateUser(userId: string) {
  const user = await userRepository.updateById(userId, { isActive: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function getUserProfile(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function updateProfile(userId: string, updates: { name?: string; email?: string; avatarUrl?: string }) {
  const user = await userRepository.updateById(userId, updates);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function registerFcmToken(userId: string, token: string) {
  await userRepository.updateOne({ _id: userId }, { $addToSet: { fcmTokens: token } });
}
