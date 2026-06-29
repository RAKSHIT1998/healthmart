import { BaseRepository } from './BaseRepository';
import { ServiceablePincodeModel, type IServiceablePincode } from '../models';

class ServiceablePincodeRepository extends BaseRepository<IServiceablePincode> {
  constructor() {
    super(ServiceablePincodeModel);
  }

  /** Fastest active branch serving this pincode, or null if nobody covers it yet. */
  async findBestForPincode(pincode: string) {
    return this.model
      .findOne({ pincode, isActive: true })
      .sort({ estimatedDeliveryMinutes: 1 })
      .populate('branchId', 'name code');
  }

  async listAll(page: number, limit: number) {
    return this.paginate({}, { page, limit, populate: 'branchId', sort: { pincode: 1 } });
  }
}

export const serviceablePincodeRepository = new ServiceablePincodeRepository();
