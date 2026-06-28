import { BaseRepository } from './BaseRepository';
import { DriverModel, type IDriver } from '../models';

class DriverRepository extends BaseRepository<IDriver> {
  constructor() {
    super(DriverModel);
  }

  async findByUserId(userId: string) {
    return this.model.findOne({ userId });
  }

  async listAvailable(branchId: string) {
    return this.model.find({ branchId, isAvailable: true }).populate('userId', 'name phone');
  }

  /** All drivers for a branch regardless of online/offline status, ranked by delivery volume — used for the admin performance overview. */
  async listByBranch(branchId: string) {
    return this.model.find({ branchId }).populate('userId', 'name phone').sort({ totalDeliveries: -1 });
  }

  async updateLocation(driverId: string, lat: number, lng: number) {
    return this.model.findByIdAndUpdate(
      driverId,
      { $set: { currentLat: lat, currentLng: lng, lastLocationUpdateAt: new Date() } },
      { new: true },
    );
  }

  async incrementDeliveries(driverId: string) {
    return this.model.findByIdAndUpdate(driverId, { $inc: { totalDeliveries: 1 } }, { new: true });
  }
}

export const driverRepository = new DriverRepository();
