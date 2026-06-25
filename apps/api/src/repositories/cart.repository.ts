import { BaseRepository } from './BaseRepository';
import { CartModel, type ICart } from '../models';

class CartRepository extends BaseRepository<ICart> {
  constructor() {
    super(CartModel);
  }

  async findByUser(userId: string) {
    return this.model.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, items: [] } },
      { upsert: true, new: true },
    );
  }

  async clear(userId: string) {
    return this.model.findOneAndUpdate(
      { userId },
      { $set: { items: [], couponCode: undefined } },
      { new: true },
    );
  }
}

export const cartRepository = new CartRepository();
