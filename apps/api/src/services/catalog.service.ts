import type {
  CreateCategoryInput,
  CreateManufacturerInput,
  CreateSupplierInput,
  UpdateCategoryInput,
} from '@healthmart/shared';
import { branchRepository, categoryRepository, manufacturerRepository, supplierRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';

export async function listCategories(group?: string) {
  return categoryRepository.find({ isActive: true, ...(group ? { group } : {}) });
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = input.slug ?? slugify(input.name);
  const exists = await categoryRepository.exists({ slug });
  if (exists) throw ApiError.conflict('A category with this slug already exists');
  return categoryRepository.create({ ...input, slug } as never);
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  Object.assign(category, input);
  await category.save();
  return category;
}

export async function deleteCategory(categoryId: string) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  category.isActive = false;
  await category.save();
}

export async function listManufacturers() {
  return manufacturerRepository.find({ isActive: true });
}

export async function createManufacturer(input: CreateManufacturerInput) {
  const slug = slugify(input.name);
  const exists = await manufacturerRepository.exists({ slug });
  if (exists) throw ApiError.conflict('A manufacturer with this name already exists');
  return manufacturerRepository.create({ ...input, slug } as never);
}

export async function listSuppliers() {
  return supplierRepository.find({ isActive: true });
}

export async function createSupplier(input: CreateSupplierInput) {
  return supplierRepository.create(input as never);
}

export async function listBranches() {
  return branchRepository.find({ isActive: true });
}
