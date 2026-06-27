import { Schema, model, Types, type Document } from 'mongoose';
import { AppointmentStatus, AppointmentType, PaymentStatus } from '@healthmart/shared';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IPrescribedMedicine {
  name: string;
  dosage?: string;
  instructions?: string;
}

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  channelName: string;
  consultationFee: number;
  paymentStatus: PaymentStatus;
  cashfreeOrderId?: string;
  cashfreePaymentSessionId?: string;
  notes?: string;
  diagnosis?: string;
  prescribedMedicines: IPrescribedMedicine[];
  prescriptionPdfUrl?: string;
  followUpDate?: Date;
  startedAt?: Date;
  endedAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const prescribedMedicineSchema = new Schema<IPrescribedMedicine>(
  {
    name: { type: String, required: true },
    dosage: { type: String },
    instructions: { type: String },
  },
  { _id: false },
);

const appointmentSchema = new Schema<IAppointment>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 30 },
    type: { type: String, enum: Object.values(AppointmentType), required: true },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.PENDING_PAYMENT,
      index: true,
    },
    channelName: { type: String, required: true, unique: true },
    consultationFee: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    cashfreeOrderId: { type: String, index: true, sparse: true },
    cashfreePaymentSessionId: { type: String },
    notes: { type: String, maxlength: 500 },
    diagnosis: { type: String, maxlength: 1000 },
    prescribedMedicines: { type: [prescribedMedicineSchema], default: [] },
    prescriptionPdfUrl: { type: String },
    followUpDate: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true },
);

// Guards against double-booking the same doctor's slot at the DB level — but only among
// "live" bookings (the partial filter), so a cancelled/completed appointment frees the
// slot for a new booking. A cron sweep (appointmentPaymentRelease.job.ts) cancels stale
// pending_payment rows so an abandoned checkout can't permanently block a slot — mirrors
// the inventory reservation pattern.
appointmentSchema.index(
  { doctorId: 1, scheduledAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
    },
  },
);

toJSONPlugin(appointmentSchema);

export const AppointmentModel = model<IAppointment>('Appointment', appointmentSchema);
