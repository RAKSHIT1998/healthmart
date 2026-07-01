import type { CreateMedicineInput, MedicineSearchQuery, UpdateMedicineInput } from '@buymedicines/shared';
import { branchRepository, medicineRepository, reviewRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';
import { inventoryRepository } from '../repositories/inventory.repository';
import { getOrSetCache, invalidateCache } from '../utils/cache';

const SEARCH_CACHE_TTL_SECONDS = 45;
const DETAIL_CACHE_TTL_SECONDS = 300;

export async function searchMedicines(query: MedicineSearchQuery) {
  // Cache the catalog-metadata search (name/price/category match) — never the
  // live stock filter below, so "in stock" results can't go stale.
  const cacheKey = `medicine:search:${JSON.stringify(query)}`;
  const result = await getOrSetCache(cacheKey, SEARCH_CACHE_TTL_SECONDS, () => medicineRepository.search(query));

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
  const medicine = await getOrSetCache(`medicine:slug:${slug}`, DETAIL_CACHE_TTL_SECONDS, async () => {
    const found = await medicineRepository.findBySlug(slug);
    if (!found) throw ApiError.notFound('Medicine not found');
    return found;
  });

  // findBySlug populates categoryId for the response, which replaces it with the populated
  // document — `.populated()` recovers the original raw ObjectId regardless of population state,
  // so this doesn't break when the field is populated (avoids casting the populated object itself).
  const categoryId = medicine.populated('categoryId') ?? medicine.categoryId;

  const [related, ratingAgg] = await Promise.all([
    medicineRepository.findRelated(String(medicine._id), String(categoryId)),
    reviewRepository.getAggregateRating(String(medicine._id)),
  ]);

  let availability = { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 };
  const branch = await branchRepository.findMainBranch();
  if (branch) {
    availability = await inventoryRepository.getAvailability(String(medicine._id), String(branch._id));
  }

  return { medicine, related, rating: ratingAgg, availability };
}

async function invalidateMedicineCaches(): Promise<void> {
  await Promise.all([invalidateCache('medicine:search:*'), invalidateCache('medicine:slug:*')]);
}

export async function createMedicine(input: CreateMedicineInput) {
  const slug = input.slug ?? slugify(input.name);
  const exists = await medicineRepository.exists({ slug });
  if (exists) throw ApiError.conflict('A medicine with this slug already exists');
  const medicine = await medicineRepository.create({ ...input, slug } as never);
  await invalidateMedicineCaches();
  return medicine;
}

export async function updateMedicine(medicineId: string, input: UpdateMedicineInput) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  Object.assign(medicine, input);
  await medicine.save();
  await invalidateMedicineCaches();
  return medicine;
}

export async function deactivateMedicine(medicineId: string) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  medicine.isActive = false;
  await medicine.save();
  await invalidateMedicineCaches();
}

export async function getMedicineById(medicineId: string) {
  const medicine = await medicineRepository.findById(medicineId);
  if (!medicine) throw ApiError.notFound('Medicine not found');
  return medicine;
}
