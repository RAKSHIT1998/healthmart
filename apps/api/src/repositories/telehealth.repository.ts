import { AppointmentStatus } from '@healthmart/shared';
import { BaseRepository } from './BaseRepository';
import { AppointmentModel, DoctorModel, type IAppointment, type IDoctor } from '../models';

class DoctorRepository extends BaseRepository<IDoctor> {
  constructor() {
    super(DoctorModel);
  }

  async findByUserId(userId: string) {
    return this.model.findOne({ userId });
  }

  async listActive(specialization?: string) {
    return this.model
      .find({ isActive: true, ...(specialization ? { specialization } : {}) })
      .populate('userId', 'name avatarUrl');
  }
}

class AppointmentRepository extends BaseRepository<IAppointment> {
  constructor() {
    super(AppointmentModel);
  }

  async findByCashfreeOrderId(cashfreeOrderId: string) {
    return this.model.findOne({ cashfreeOrderId });
  }

  /** Booked/confirmed appointments for a doctor on a given UTC day — used to exclude already-taken slots. */
  async findScheduledForDoctorBetween(doctorId: string, from: Date, to: Date) {
    return this.model.find({
      doctorId,
      scheduledAt: { $gte: from, $lte: to },
      status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
    });
  }

  async listForPatient(patientId: string, page: number, limit: number) {
    return this.paginate({ patientId }, { page, limit, sort: { scheduledAt: -1 }, populate: 'doctorId' });
  }

  async listForDoctor(doctorId: string, page: number, limit: number) {
    return this.paginate({ doctorId }, { page, limit, sort: { scheduledAt: -1 }, populate: 'patientId' });
  }
}

export const doctorRepository = new DoctorRepository();
export const appointmentRepository = new AppointmentRepository();
