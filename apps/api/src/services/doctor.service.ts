import { Role, type CreateDoctorInput, type UpdateDoctorInput } from '@healthmart/shared';
import { appointmentRepository, doctorRepository, userRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/hash';

export async function createDoctor(input: CreateDoctorInput) {
  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) throw ApiError.conflict('A user with this email already exists');

  const user = await userRepository.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash: await hashPassword(input.password),
    role: Role.DOCTOR,
    isEmailVerified: true,
    isPhoneVerified: true,
  } as never);

  return doctorRepository.create({
    userId: user._id,
    specialization: input.specialization,
    qualification: input.qualification,
    experienceYears: input.experienceYears,
    consultationFee: input.consultationFee,
    languages: input.languages,
    about: input.about,
    profileImage: input.profileImage,
    supportsVideo: input.supportsVideo,
    supportsAudio: input.supportsAudio,
    weeklySchedule: input.weeklySchedule,
  } as never);
}

export async function listDoctors(specialization?: string) {
  return doctorRepository.listActive(specialization);
}

export async function getDoctorById(doctorId: string) {
  const doctor = await doctorRepository.findById(doctorId);
  if (!doctor) throw ApiError.notFound('Doctor not found');
  return doctor.populate('userId', 'name avatarUrl');
}

export async function getDoctorProfileByUserId(userId: string) {
  const doctor = await doctorRepository.findByUserId(userId);
  if (!doctor) throw ApiError.notFound('Doctor profile not found for this account');
  return doctor;
}

export async function updateDoctor(doctorId: string, input: UpdateDoctorInput) {
  const doctor = await doctorRepository.findById(doctorId);
  if (!doctor) throw ApiError.notFound('Doctor not found');
  Object.assign(doctor, input);
  await doctor.save();
  return doctor;
}

interface SlotWindow {
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

function generateSlotsForWindow(dateOnly: string, window: SlotWindow): Date[] {
  const slots: Date[] = [];
  const [startH, startM] = window.startTime.split(':').map(Number);
  const [endH, endM] = window.endTime.split(':').map(Number);

  let cursor = new Date(`${dateOnly}T00:00:00.000Z`);
  cursor.setUTCHours(startH ?? 0, startM ?? 0, 0, 0);
  const end = new Date(`${dateOnly}T00:00:00.000Z`);
  end.setUTCHours(endH ?? 0, endM ?? 0, 0, 0);

  while (cursor < end) {
    slots.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + window.slotDurationMinutes * 60_000);
  }
  return slots;
}

export async function getAvailableSlots(doctorId: string, dateOnly: string) {
  const doctor = await doctorRepository.findById(doctorId);
  if (!doctor) throw ApiError.notFound('Doctor not found');

  const dayOfWeek = new Date(`${dateOnly}T00:00:00.000Z`).getUTCDay();
  const windows = doctor.weeklySchedule.filter((w) => w.dayOfWeek === dayOfWeek);
  if (windows.length === 0) return [];

  const allSlots = windows.flatMap((w) => generateSlotsForWindow(dateOnly, w));

  const dayStart = new Date(`${dateOnly}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateOnly}T23:59:59.999Z`);
  const booked = await appointmentRepository.findScheduledForDoctorBetween(doctorId, dayStart, dayEnd);
  const bookedTimes = new Set(booked.map((b) => b.scheduledAt.getTime()));

  const now = new Date();
  return allSlots.filter((slot) => slot > now && !bookedTimes.has(slot.getTime())).map((slot) => slot.toISOString());
}
