import { Types } from 'mongoose';
import {
  AppointmentStatus,
  NotificationChannel,
  NotificationType,
  PaymentStatus,
  type BookAppointmentInput,
  type CompleteConsultationInput,
} from '@healthmart/shared';
import { appointmentRepository, doctorRepository, userRepository } from '../repositories';
import { ApiError } from '../utils/ApiError';
import { createCashfreeOrder, initiateCashfreeRefund } from '../integrations/cashfree';
import { generateVideoToken } from '../integrations/agora';
import { uploadToCloudinary } from '../integrations/cloudinary';
import { generateConsultationPrescriptionPdf } from '../integrations/pdf/consultationPdf';
import { notifyUser } from './notification.service';
import type { IAppointment } from '../models';

const JOIN_WINDOW_BEFORE_MINUTES = 10;
const JOIN_WINDOW_AFTER_MINUTES = 60;

export async function bookAppointment(patientId: string, input: BookAppointmentInput) {
  const doctor = await doctorRepository.findById(input.doctorId);
  if (!doctor || !doctor.isActive) throw ApiError.notFound('Doctor not found or not currently accepting appointments');

  const type = input.type;
  if (type === 'video' && !doctor.supportsVideo) throw ApiError.badRequest('This doctor does not offer video consultations');
  if (type === 'audio' && !doctor.supportsAudio) throw ApiError.badRequest('This doctor does not offer audio consultations');

  const scheduledAt = new Date(input.scheduledAt);
  if (scheduledAt < new Date()) throw ApiError.badRequest('Cannot book an appointment in the past');

  const patient = await userRepository.findById(patientId);
  if (!patient) throw ApiError.notFound('Patient not found');

  const appointmentId = new Types.ObjectId();

  let appointment: IAppointment;
  try {
    appointment = await appointmentRepository.create({
      _id: appointmentId,
      doctorId: doctor._id,
      patientId,
      scheduledAt,
      type,
      status: AppointmentStatus.PENDING_PAYMENT,
      channelName: `consult-${appointmentId}`,
      consultationFee: doctor.consultationFee,
      paymentStatus: PaymentStatus.PENDING,
      notes: input.notes,
    } as never);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw ApiError.conflict('This slot was just booked by someone else. Please pick another time.');
    }
    throw err;
  }

  const { paymentSessionId, cfOrderId } = await createCashfreeOrder({
    orderId: `APT-${appointmentId}`,
    amount: doctor.consultationFee,
    customerId: patientId,
    customerPhone: patient.phone ?? '',
    customerEmail: patient.email,
    returnUrl: input.returnUrlBase ? `${input.returnUrlBase}/account/appointments` : '',
  });

  appointment.cashfreeOrderId = cfOrderId;
  appointment.cashfreePaymentSessionId = paymentSessionId;
  await appointment.save();

  return { appointment, paymentSessionId };
}

export async function confirmAppointmentPayment(appointmentId: string): Promise<void> {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment || appointment.status !== AppointmentStatus.PENDING_PAYMENT) return;

  appointment.status = AppointmentStatus.SCHEDULED;
  appointment.paymentStatus = PaymentStatus.PAID;
  await appointment.save();

  const doctor = await doctorRepository.findById(String(appointment.doctorId));

  await notifyUser({
    userId: String(appointment.patientId),
    type: NotificationType.SYSTEM,
    title: 'Appointment confirmed',
    message: `Your ${appointment.type} consultation is confirmed for ${appointment.scheduledAt.toLocaleString()}.`,
    channels: [NotificationChannel.IN_APP, NotificationChannel.SMS, NotificationChannel.PUSH],
  });

  if (doctor) {
    await notifyUser({
      userId: String(doctor.userId),
      type: NotificationType.SYSTEM,
      title: 'New appointment booked',
      message: `A patient booked a ${appointment.type} consultation for ${appointment.scheduledAt.toLocaleString()}.`,
      channels: [NotificationChannel.IN_APP],
    });
  }
}

export async function failAppointmentPayment(appointmentId: string): Promise<void> {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment || appointment.status !== AppointmentStatus.PENDING_PAYMENT) return;
  appointment.status = AppointmentStatus.CANCELLED;
  appointment.paymentStatus = PaymentStatus.FAILED;
  appointment.cancellationReason = 'Payment failed';
  await appointment.save();
}

export async function listMyAppointments(patientId: string, page: number, limit: number) {
  return appointmentRepository.listForPatient(patientId, page, limit);
}

export async function listDoctorAppointments(doctorUserId: string, page: number, limit: number) {
  const doctor = await doctorRepository.findByUserId(doctorUserId);
  if (!doctor) throw ApiError.notFound('Doctor profile not found');
  return appointmentRepository.listForDoctor(String(doctor._id), page, limit);
}

async function assertParticipant(appointment: IAppointment, userId: string): Promise<{ isDoctor: boolean }> {
  if (String(appointment.patientId) === userId) return { isDoctor: false };
  const doctor = await doctorRepository.findById(String(appointment.doctorId));
  if (doctor && String(doctor.userId) === userId) return { isDoctor: true };
  throw ApiError.forbidden('You are not a participant in this appointment');
}

export async function getVideoToken(appointmentId: string, userId: string) {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  await assertParticipant(appointment, userId);

  if (![AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS].includes(appointment.status)) {
    throw ApiError.badRequest('This appointment is not currently joinable');
  }

  const windowStart = new Date(appointment.scheduledAt.getTime() - JOIN_WINDOW_BEFORE_MINUTES * 60_000);
  const windowEnd = new Date(appointment.scheduledAt.getTime() + JOIN_WINDOW_AFTER_MINUTES * 60_000);
  const now = new Date();
  if (now < windowStart || now > windowEnd) {
    throw ApiError.badRequest('You can join this call starting 10 minutes before the scheduled time');
  }

  if (appointment.status === AppointmentStatus.SCHEDULED) {
    appointment.status = AppointmentStatus.IN_PROGRESS;
    appointment.startedAt = now;
    await appointment.save();
  }

  return generateVideoToken(appointment.channelName, userId);
}

export async function completeConsultation(appointmentId: string, doctorUserId: string, input: CompleteConsultationInput) {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  const { isDoctor } = await assertParticipant(appointment, doctorUserId);
  if (!isDoctor) throw ApiError.forbidden('Only the consulting doctor can complete this appointment');

  appointment.diagnosis = input.diagnosis;
  appointment.prescribedMedicines = input.prescribedMedicines;
  appointment.followUpDate = input.followUpDate ? new Date(input.followUpDate) : undefined;
  appointment.status = AppointmentStatus.COMPLETED;
  appointment.endedAt = new Date();

  try {
    const doctor = await doctorRepository
      .findById(String(appointment.doctorId))
      .then((d) => d?.populate<{ userId: { name: string } }>('userId', 'name'));
    const patient = await userRepository.findById(String(appointment.patientId));
    if (doctor && patient) {
      const pdfBuffer = await generateConsultationPrescriptionPdf(appointment, doctor, patient);
      const upload = await uploadToCloudinary(pdfBuffer, 'consultation-prescriptions', 'application/pdf', 'raw');
      appointment.prescriptionPdfUrl = upload.url;
    }
  } catch {
    // PDF generation/upload is best-effort — the consultation record itself must still save.
  }

  await appointment.save();
  await doctorRepository.updateById(String(appointment.doctorId), { $inc: { totalConsultations: 1 } } as never);

  await notifyUser({
    userId: String(appointment.patientId),
    type: NotificationType.SYSTEM,
    title: 'Consultation completed',
    message: 'Your doctor has completed the consultation. Your prescription is ready to download.',
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  });

  return appointment;
}

export async function cancelAppointment(appointmentId: string, userId: string, reason: string) {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) throw ApiError.notFound('Appointment not found');
  await assertParticipant(appointment, userId);

  if (![AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.SCHEDULED].includes(appointment.status)) {
    throw ApiError.badRequest('This appointment can no longer be cancelled');
  }

  const wasPaid = appointment.paymentStatus === PaymentStatus.PAID;
  appointment.status = AppointmentStatus.CANCELLED;
  appointment.cancellationReason = reason;

  if (wasPaid && appointment.cashfreeOrderId) {
    await initiateCashfreeRefund(appointment.cashfreeOrderId, appointment.consultationFee, `apt_refund_${appointment._id}`);
    appointment.paymentStatus = PaymentStatus.REFUNDED;
  }

  await appointment.save();
  return appointment;
}
