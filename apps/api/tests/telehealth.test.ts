import { Types } from 'mongoose';
import { AppointmentStatus, Role } from '@healthmart/shared';
import { setupTestDB, teardownTestDB, clearDatabase } from './utils/db';
import { createCustomer } from './utils/fixtures';
import { DoctorModel, UserModel } from '../src/models';
import { appointmentRepository } from '../src/repositories';
import { getAvailableSlots } from '../src/services/doctor.service';
import { cancelAppointment, getVideoToken } from '../src/services/appointment.service';
import { ApiError } from '../src/utils/ApiError';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDatabase);

async function createDoctorFixture() {
  const doctorUser = await UserModel.create({
    name: 'Dr. Test',
    email: `doctor-${Date.now()}@example.com`,
    phone: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
    role: Role.DOCTOR,
    isPhoneVerified: true,
    isEmailVerified: true,
  });

  const doctor = await DoctorModel.create({
    userId: doctorUser._id,
    specialization: 'General Physician',
    qualification: 'MBBS',
    experienceYears: 5,
    consultationFee: 500,
    supportsVideo: true,
    supportsAudio: true,
    weeklySchedule: [{ dayOfWeek: new Date().getUTCDay(), startTime: '00:00', endTime: '23:30', slotDurationMinutes: 30 }],
  });

  return { doctorUser, doctor };
}

describe('Doctor availability', () => {
  it('generates slots from the weekly schedule and excludes already-booked times', async () => {
    const { doctor } = await createDoctorFixture();
    const patient = await createCustomer();
    const today = new Date().toISOString().slice(0, 10);

    const slotsBefore = await getAvailableSlots(String(doctor._id), today);
    expect(slotsBefore.length).toBeGreaterThan(0);

    const bookedSlot = slotsBefore[slotsBefore.length - 1]!;
    await appointmentRepository.create({
      doctorId: doctor._id,
      patientId: patient._id,
      scheduledAt: new Date(bookedSlot),
      type: 'video',
      status: AppointmentStatus.SCHEDULED,
      channelName: `consult-${new Types.ObjectId()}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'paid',
    } as never);

    const slotsAfter = await getAvailableSlots(String(doctor._id), today);
    expect(slotsAfter).not.toContain(bookedSlot);
    expect(slotsAfter.length).toBe(slotsBefore.length - 1);
  });
});

describe('Appointment slot booking guard', () => {
  it('prevents two appointments from being created for the same doctor at the same time', async () => {
    const { doctor } = await createDoctorFixture();
    const patientA = await createCustomer();
    const patientB = await createCustomer();
    const scheduledAt = new Date(Date.now() + 60 * 60_000);

    await appointmentRepository.create({
      doctorId: doctor._id,
      patientId: patientA._id,
      scheduledAt,
      type: 'video',
      status: AppointmentStatus.SCHEDULED,
      channelName: `consult-${new Types.ObjectId()}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'paid',
    } as never);

    await expect(
      appointmentRepository.create({
        doctorId: doctor._id,
        patientId: patientB._id,
        scheduledAt,
        type: 'video',
        status: AppointmentStatus.PENDING_PAYMENT,
        channelName: `consult-${new Types.ObjectId()}`,
        consultationFee: doctor.consultationFee,
        paymentStatus: 'pending',
      } as never),
    ).rejects.toThrow();
  });

  it('allows rebooking the same slot once the original appointment is cancelled', async () => {
    const { doctor } = await createDoctorFixture();
    const patientA = await createCustomer();
    const patientB = await createCustomer();
    const scheduledAt = new Date(Date.now() + 60 * 60_000);

    const original = await appointmentRepository.create({
      doctorId: doctor._id,
      patientId: patientA._id,
      scheduledAt,
      type: 'video',
      status: AppointmentStatus.CANCELLED,
      channelName: `consult-${new Types.ObjectId()}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'failed',
    } as never);
    expect(original.status).toBe(AppointmentStatus.CANCELLED);

    const second = await appointmentRepository.create({
      doctorId: doctor._id,
      patientId: patientB._id,
      scheduledAt,
      type: 'video',
      status: AppointmentStatus.SCHEDULED,
      channelName: `consult-${new Types.ObjectId()}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'paid',
    } as never);
    expect(second.status).toBe(AppointmentStatus.SCHEDULED);
  });
});

describe('Video token access control', () => {
  it('rejects a user who is not a participant in the appointment', async () => {
    const { doctor } = await createDoctorFixture();
    const patient = await createCustomer();
    const stranger = await createCustomer();

    const appointment = await appointmentRepository.create({
      doctorId: doctor._id,
      patientId: patient._id,
      scheduledAt: new Date(),
      type: 'video',
      status: AppointmentStatus.SCHEDULED,
      channelName: `consult-${new Types.ObjectId()}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'paid',
    } as never);

    await expect(getVideoToken(String(appointment._id), String(stranger._id))).rejects.toThrow(ApiError);
  });

  it('rejects joining outside the allowed time window', async () => {
    const { doctor } = await createDoctorFixture();
    const patient = await createCustomer();

    const appointment = await appointmentRepository.create({
      doctorId: doctor._id,
      patientId: patient._id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60_000), // tomorrow — outside the join window
      type: 'video',
      status: AppointmentStatus.SCHEDULED,
      channelName: `consult-${new Types.ObjectId()}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'paid',
    } as never);

    await expect(getVideoToken(String(appointment._id), String(patient._id))).rejects.toThrow(ApiError);
  });
});

describe('Appointment cancellation', () => {
  it('lets the patient cancel a scheduled appointment', async () => {
    const { doctor } = await createDoctorFixture();
    const patient = await createCustomer();

    const appointment = await appointmentRepository.create({
      doctorId: doctor._id,
      patientId: patient._id,
      scheduledAt: new Date(Date.now() + 60 * 60_000),
      type: 'video',
      status: AppointmentStatus.SCHEDULED,
      channelName: `consult-${new Types.ObjectId()}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'pending',
    } as never);

    const cancelled = await cancelAppointment(String(appointment._id), String(patient._id), 'Cannot make it');
    expect(cancelled.status).toBe(AppointmentStatus.CANCELLED);
  });

  it('rejects cancellation from someone who is not a participant', async () => {
    const { doctor } = await createDoctorFixture();
    const patient = await createCustomer();
    const stranger = await createCustomer();

    const appointment = await appointmentRepository.create({
      doctorId: doctor._id,
      patientId: patient._id,
      scheduledAt: new Date(Date.now() + 60 * 60_000),
      type: 'video',
      status: AppointmentStatus.SCHEDULED,
      channelName: `consult-${new Types.ObjectId()}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'pending',
    } as never);

    await expect(cancelAppointment(String(appointment._id), String(stranger._id), 'n/a')).rejects.toThrow(ApiError);
  });
});
