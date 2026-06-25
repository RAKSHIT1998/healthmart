import { BaseRepository } from './BaseRepository';
import { WishlistModel, type IWishlist } from '../models';

class WishlistRepository extends BaseRepository<IWishlist> {
  constructor() {
    super(WishlistModel);
  }

  async findOrCreateForUser(userId: string) {
    return this.model.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, medicineIds: [] } },
      { upsert: true, new: true },
    );
  }

  async addMedicine(userId: string, medicineId: string) {
    return this.model.findOneAndUpdate(
      { userId },
      { $addToSet: { medicineIds: medicineId } },
      { upsert: true, new: true },
    );
  }

  async removeMedicine(userId: string, medicineId: string) {
    return this.model.findOneAndUpdate(
      { userId },
      { $pull: { medicineIds: medicineId } },
      { new: true },
    );
  }
}

export const wishlistRepository = new WishlistRepository();
