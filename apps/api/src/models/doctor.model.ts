import { Schema, model, Types, type Document } from 'mongoose';
import { toJSONPlugin } from './plugins/toJSON.plugin';

export interface IWeeklySlot {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string;
  slotDurationMinutes: number;
}

export interface IDoctor extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  languages: string[];
  about?: string;
  profileImage?: string;
  supportsVideo: boolean;
  supportsAudio: boolean;
  weeklySchedule: IWeeklySlot[];
  rating: number;
  totalConsultations: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const weeklySlotSchema = new Schema<IWeeklySlot>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDurationMinutes: { type: Number, default: 30 },
  },
  { _id: false },
);

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, index: true },
    qualification: { type: String, required: true },
    experienceYears: { type: Number, required: true, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    languages: { type: [String], default: ['English'] },
    about: { type: String, maxlength: 1000 },
    profileImage: { type: String },
    supportsVideo: { type: Boolean, default: true },
    supportsAudio: { type: Boolean, default: true },
    weeklySchedule: { type: [weeklySlotSchema], default: [] },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    totalConsultations: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

toJSONPlugin(doctorSchema);

export const DoctorModel = model<IDoctor>('Doctor', doctorSchema);
