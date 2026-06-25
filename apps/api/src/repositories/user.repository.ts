import { BaseRepository } from './BaseRepository';
import { UserModel, type IUser } from '../models';

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByPhone(phone: string) {
    return this.model.findOne({ phone });
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  }

  async incrementTokenVersion(userId: string) {
    return this.model.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true });
  }
}

export const userRepository = new UserRepository();
