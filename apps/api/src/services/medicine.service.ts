import type { CreateMedicineInput, MedicineSearchQuery, UpdateMedicineInput } from '@healthmart/shared';
import { branchRepository, medicineRepository, reviewRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { inventoryRepository } from '../repositories/inventory.repository';

export async function searchMedicines(query: MedicineSearchQuery) {
  const result = await medicineRepository.search(query);

  if (!query.inStockOnly) return result;

  const branch = await branchRepository.findMainBranch();
  if (!branch) return result;

  const availabilityChecks = await Promise.all(
    result.items.map((item) => inventoryRepository.getAvailability(String(item._id), String(branch._id))),
  );
  const inStockItems = result.items.filter((_, idx) => availabilityChecks[idx]!.availableQuantity > 0);

  return { items: inStockItems, pagination: result.pagination };
}

export async function getMedicineBySlug(slug: string) {
  const medicine = await medicineRepository.findBySlug(slug);
  if (!medicine) throw ApiError.notFound('Medicine not found');

  const [related, ratingAgg] = await Promise.all([
    medicineRepository.findRelated(String(medicine._id), String(medicine.categoryId)),
    reviewRepository.getAggregateRating(String(medicine._id)),
  ]);

  let availability = { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 };
  const branch = await branchRepository.findMainBranch();
  if (branch) {
    availability = await inventoryRepository.getAvailability(String(medicine._id), String(branch._id));
  }

  return { medicine, related, rating: ratingAgg, availability };
}

export async function createMedicine(input: CreateMedicineInput) {
  const slug = input.slug ?? slugify(input.name);
  const exists = await medicineRepository.exists({ slug });
  if (exists) throw ApiError.conflict('A medicine with this slug already exists');
  return medicineRepository.create({ ...input, slug } as never);
}

export async function updateMedicine(medicineId: string, input: UpdateMedicineInput) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  Object.assign(medicine, input);
  await medicine.save();
  return medicine;
}

export async function deactivateMedicine(medicineId: string) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  medicine.isActive = false;
  await medicine.save();
}

export async function getMedicineById(medicineId: string) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  return medicine;
}
