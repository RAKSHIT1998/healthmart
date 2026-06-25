import { BaseRepository } from './BaseRepository';
import {
  BranchModel,
  CategoryModel,
  ManufacturerModel,
  SupplierModel,
  type IBranch,
  type ICategory,
  type IManufacturer,
  type ISupplier,
} from '../models';

class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(CategoryModel);
  }

  async findBySlug(slug: string) {
    return this.model.findOne({ slug });
  }
}

class ManufacturerRepository extends BaseRepository<IManufacturer> {
  constructor() {
    super(ManufacturerModel);
  }

  async findOrCreateByName(name: string) {
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.model.findOne({ slug });
    if (existing) return existing;
    return this.model.create({ name, slug });
  }
}

class SupplierRepository extends BaseRepository<ISupplier> {
  constructor() {
    super(SupplierModel);
  }

  async findByMargCode(margSupplierCode: string) {
    return this.model.findOne({ margSupplierCode });
  }
}

class BranchRepository extends BaseRepository<IBranch> {
  constructor() {
    super(BranchModel);
  }

  async findMainBranch() {
    return this.model.findOne({ isMainBranch: true, isActive: true });
  }
}

export const categoryRepository = new CategoryRepository();
export const manufacturerRepository = new ManufacturerRepository();
export const supplierRepository = new SupplierRepository();
export const branchRepository = new BranchRepository();
