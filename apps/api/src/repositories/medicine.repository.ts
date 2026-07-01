import type { FilterQuery } from 'mongoose';
import type { MedicineSearchQuery } from '@buymedicines/shared';
import { buildPaginationMeta } from '../utils/apiResponse';
import { BaseRepository } from './BaseRepository';
import { MedicineModel, type IMedicine } from '../models';

const SORT_MAP: Record<MedicineSearchQuery['sortBy'], Record<string, 1 | -1>> = {
  price: { sellingPrice: 1 },
  popularity: { salesCount: -1 },
  newest: { createdAt: -1 },
  discount: { sellingPrice: 1 },
  relevance: { score: { $meta: 'textScore' } } as unknown as Record<string, 1 | -1>,
};

class MedicineRepository extends BaseRepository<IMedicine> {
  constructor() {
    super(MedicineModel);
  }

  async findBySlug(slug: string) {
    return this.model
      .findOne({ slug, isActive: true })
      .populate('manufacturerId', 'name logo')
      .populate('categoryId', 'name slug group')
      .populate('alternativeMedicineIds', 'name slug images sellingPrice mrp');
  }

  async findByMargItemCode(margItemCode: string) {
    return this.model.findOne({ margItemCode });
  }

  async search(query: MedicineSearchQuery) {
    const filter: FilterQuery<IMedicine> = { isActive: true };

    if (query.q) {
      filter.$text = { $search: query.q };
    }
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.manufacturerId) filter.manufacturerId = query.manufacturerId;
    if (query.categoryGroup) filter.categoryGroup = query.categoryGroup;
    if (query.prescriptionRequired !== undefined) {
      filter.prescriptionRequired = query.prescriptionRequired;
    }
    if (query.isGeneric !== undefined) {
      filter.isGeneric = query.isGeneric;
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.sellingPrice = {
        ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
      };
    }

    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
    let sort: Record<string, 1 | -1>;
    if (query.sortBy === 'relevance' && query.q) {
      sort = { score: { $meta: 'textScore' } } as unknown as Record<string, 1 | -1>;
    } else if (query.sortBy === 'discount') {
      sort = { sellingPrice: sortDirection };
    } else {
      const base = SORT_MAP[query.sortBy] ?? { createdAt: -1 };
      sort = Object.fromEntries(
        Object.entries(base).map(([key, _val]) => [key, sortDirection as 1 | -1]),
      );
    }

    const skip = (query.page - 1) * query.limit;
    const projection = query.q ? { score: { $meta: 'textScore' } } : undefined;

    let mongoQuery = this.model
      .find(filter, projection)
      .populate('manufacturerId', 'name logo')
      .populate('categoryId', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(query.limit);

    const [items, total] = await Promise.all([
      mongoQuery.exec(),
      this.model.countDocuments(filter),
    ]);

    return { items, pagination: buildPaginationMeta(total, query.page, query.limit) };
  }

  async findRelated(medicineId: string, categoryId: string, limit = 8) {
    return this.model
      .find({ categoryId, _id: { $ne: medicineId }, isActive: true })
      .limit(limit)
      .select('name slug images sellingPrice mrp prescriptionRequired');
  }

  async incrementSalesCount(medicineId: string, quantity: number) {
    return this.model.updateOne({ _id: medicineId }, { $inc: { salesCount: quantity } });
  }

  async updateRatingAggregate(medicineId: string, ratingsAverage: number, ratingsCount: number) {
    return this.model.updateOne({ _id: medicineId }, { $set: { ratingsAverage, ratingsCount } });
  }
}

export const medicineRepository = new MedicineRepository();
