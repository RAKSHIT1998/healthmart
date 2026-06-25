import { BaseRepository } from './BaseRepository';
import { AddressModel, type IAddress } from '../models';

class AddressRepository extends BaseRepository<IAddress> {
  constructor() {
    super(AddressModel);
  }

  async listForUser(userId: string) {
    return this.model.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  async clearDefault(userId: string) {
    return this.model.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
  }
}

export const addressRepository = new AddressRepository();
