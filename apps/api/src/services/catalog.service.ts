import type {
  CreateBranchInput,
  CreateCategoryInput,
  CreateManufacturerInput,
  CreateSupplierInput,
  UpdateBranchInput,
  UpdateCategoryInput,
} from '@buymedicines/shared';
import { branchRepository, categoryRepository, manufacturerRepository, supplierRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { getOrSetCache, invalidateCache } from '../utils/cache';

const CATALOG_CACHE_TTL_SECONDS = 600;

export async function listCategories(group?: string) {
  return getOrSetCache(`categories:${group ?? 'all'}`, CATALOG_CACHE_TTL_SECONDS, () =>
    categoryRepository.find({ isActive: true, ...(group ? { group } : {}) }),
  );
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug ?? slugify(input.name);
  const exists = await categoryRepository.exists({ slug });
  if (exists) throw ApiError.conflict('A category with this slug already exists');
  const category = await categoryRepository.create({ ...input, slug } as never);
  await invalidateCache('categories:*');
  return category;
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  Object.assign(category, input);
  await category.save();
  await invalidateCache('categories:*');
  return category;
}

export async function deleteCategory(categoryId: string) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  category.isActive = false;
  await category.save();
  await invalidateCache('categories:*');
}

export async function listManufacturers() {
  return getOrSetCache('manufacturers:all', CATALOG_CACHE_TTL_SECONDS, () => manufacturerRepository.find({ isActive: true }));
}

export async function createManufacturer(input: CreateManufacturerInput) {
  const slug = slugify(input.name);
  const exists = await manufacturerRepository.exists({ slug });
  if (exists) throw ApiError.conflict('A manufacturer with this name already exists');
  const manufacturer = await manufacturerRepository.create({ ...input, slug } as never);
  await invalidateCache('manufacturers:*');
  return manufacturer;
}

export async function listSuppliers() {
  return supplierRepository.find({ isActive: true });
}

export async function createSupplier(input: CreateSupplierInput) {
  return supplierRepository.create(input as never);
}

export async function listBranches() {
  return getOrSetCache('branches:all', CATALOG_CACHE_TTL_SECONDS, () => branchRepository.find({ isActive: true }));
}

export async function listBranchesForAdmin() {
  return branchRepository.find({});
}

export async function createBranch(input: CreateBranchInput) {
  const exists = await branchRepository.exists({ code: input.code.toUpperCase() });
  if (exists) throw ApiError.conflict('A branch with this code already exists');

  if (input.isMainBranch) {
    await branchRepository.updateMany({ isMainBranch: true }, { $set: { isMainBranch: false } });
  }

  const branch = await branchRepository.create({ ...input, code: input.code.toUpperCase() } as never);
  await invalidateCache('branches:*');
  return branch;
}

export async function updateBranch(branchId: string, input: UpdateBranchInput) {
  const branch = await branchRepository.findById(branchId);
  if (!branch) throw ApiError.notFound('Branch not found');

  if (input.isMainBranch) {
    await branchRepository.updateMany({ _id: { $ne: branchId }, isMainBranch: true }, { $set: { isMainBranch: false } });
  }

  Object.assign(branch, input);
  await branch.save();
  await invalidateCache('branches:*');
  return branch;
}

export async function deactivateBranch(branchId: string) {
  const branch = await branchRepository.findById(branchId);
  if (!branch) throw ApiError.notFound('Branch not found');
  if (branch.isMainBranch) throw ApiError.badRequest('Cannot deactivate the main branch — set another branch as main first');
  branch.isActive = false;
  await branch.save();
  await invalidateCache('branches:*');
}
