'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiFetchWithMeta, ApiClientError } from '@/lib/admin-api';

export interface WeeklySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface Doctor {
  id: string;
  userId: { id: string; name: string; avatarUrl?: string } | string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  languages: string[];
  about?: string;
  supportsVideo: boolean;
  supportsAudio: boolean;
  weeklySchedule: WeeklySlot[];
  rating: number;
  totalConsultations: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  doctorId: { id: string; specialization: string; userId?: { name: string } } | string;
  patientId: { id: string; name: string; phone?: string } | string;
  scheduledAt: string;
  type: 'video' | 'audio';
  status: string;
  consultationFee: number;
  paymentStatus: string;
  notes?: string;
  diagnosis?: string;
  prescriptionPdfUrl?: string;
}

export function useDoctors() {
  return useQuery({ queryKey: ['doctors'], queryFn: () => api.get<Doctor[]>('/telehealth/doctors', { auth: false }) });
}

export interface CreateDoctorInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  languages: string[];
  supportsVideo: boolean;
  supportsAudio: boolean;
  weeklySchedule: WeeklySlot[];
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDoctorInput) => api.post<Doctor>('/telehealth/doctors', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor onboarded');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useMyDoctorAppointments(page: number) {
  return useQuery({
    queryKey: ['doctor-appointments', page],
    queryFn: () => apiFetchWithMeta<Appointment>(`/telehealth/doctor/appointments?page=${page}&limit=20`),
  });
}

export function useCompleteConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      diagnosis,
      prescribedMedicines,
    }: {
      id: string;
      diagnosis: string;
      prescribedMedicines: Array<{ name: string; dosage?: string; instructions?: string }>;
    }) => api.post<Appointment>(`/telehealth/appointments/${id}/complete`, { diagnosis, prescribedMedicines }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      toast.success('Consultation completed and prescription generated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useVideoToken(appointmentId: string | null) {
  return useQuery({
    queryKey: ['video-token', appointmentId],
    queryFn: () => api.get<{ appId: string; channelName: string; token: string; uid: string }>(`/telehealth/appointments/${appointmentId}/video-token`),
    enabled: !!appointmentId,
    retry: false,
  });
}
