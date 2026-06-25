import type {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { buildPaginationMeta } from '../utils/apiResponse';
import type { PaginatedResult, PaginationMeta } from '@healthmart/shared';

export interface PaginateOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
  projection?: ProjectionType<unknown>;
  populate?: string | string[];
}

/** Generic CRUD wrapper over a Mongoose model. Concrete repositories add domain-specific queries on top. */
export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>) {
    return this.model.create(data);
  }

  async findById(id: string | Types.ObjectId, projection?: ProjectionType<T>) {
    return this.model.findById(id, projection);
  }

  async findOne(filter: FilterQuery<T>, projection?: ProjectionType<T>) {
    return this.model.findOne(filter, projection);
  }

  async find(filter: FilterQuery<T>, options?: QueryOptions<T>) {
    return this.model.find(filter, null, options);
  }

  async updateById(id: string | Types.ObjectId, update: UpdateQuery<T>) {
    return this.model.findByIdAndUpdate(id, update, { new: true });
  }

  async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>) {
    return this.model.findOneAndUpdate(filter, update, { new: true });
  }

  async deleteById(id: string | Types.ObjectId) {
    return this.model.findByIdAndDelete(id);
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.exists(filter);
    return !!doc;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async paginate(filter: FilterQuery<T>, options: PaginateOptions): Promise<PaginatedResult<T>> {
    const { page, limit, sort, projection, populate } = options;
    const skip = (page - 1) * limit;

    let query = this.model.find(filter, projection).sort(sort ?? { createdAt: -1 }).skip(skip).limit(limit);
    if (populate) {
      query = query.populate(populate as string);
    }

    const [items, total] = await Promise.all([query.exec(), this.model.countDocuments(filter)]);

    const pagination: PaginationMeta = buildPaginationMeta(total, page, limit);
    return { items: items as unknown as T[], pagination };
  }
}
