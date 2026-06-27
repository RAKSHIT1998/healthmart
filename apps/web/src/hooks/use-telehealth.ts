'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, publicApiFetch, ApiClientError } from '@/lib/api';

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
  profileImage?: string;
  supportsVideo: boolean;
  supportsAudio: boolean;
  rating: number;
  totalConsultations: number;
}

export interface Appointment {
  id: string;
  doctorId: { id: string; specialization: string; userId?: { name: string } } | string;
  scheduledAt: string;
  type: 'video' | 'audio';
  status: string;
  consultationFee: number;
  paymentStatus: string;
  diagnosis?: string;
  prescribedMedicines: Array<{ name: string; dosage?: string; instructions?: string }>;
  prescriptionPdfUrl?: string;
}

export function useDoctors(specialization?: string) {
  return useQuery({
    queryKey: ['doctors', specialization],
    queryFn: () => publicApiFetch<Doctor[]>(`/telehealth/doctors${specialization ? `?specialization=${encodeURIComponent(specialization)}` : ''}`),
  });
}

export function useDoctor(doctorId: string) {
  return useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => publicApiFetch<Doctor>(`/telehealth/doctors/${doctorId}`),
    enabled: !!doctorId,
  });
}

export function useDoctorAvailability(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['doctor-availability', doctorId, date],
    queryFn: () => publicApiFetch<string[]>(`/telehealth/doctors/${doctorId}/availability?date=${date}`),
    enabled: !!doctorId && !!date,
  });
}

interface BookAppointmentInput {
  doctorId: string;
  scheduledAt: string;
  type: 'video' | 'audio';
  notes?: string;
}

export function useBookAppointment() {
  return useMutation({
    mutationFn: (input: BookAppointmentInput) =>
      api.post<{ appointment: Appointment; paymentSessionId: string }>('/telehealth/appointments', {
        ...input,
        returnUrlBase: window.location.origin,
      }),
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useMyAppointments(page = 1) {
  return useQuery({
    queryKey: ['my-appointments', page],
    queryFn: () => api.get<Appointment[]>(`/telehealth/appointments/mine?page=${page}&limit=20`),
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/telehealth/appointments/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      toast.success('Appointment cancelled');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });
}

export function useVideoToken(appointmentId: string | null) {
  return useQuery({
    queryKey: ['video-token', appointmentId],
    queryFn: () =>
      api.get<{ appId: string; channelName: string; token: string; uid: string }>(
        `/telehealth/appointments/${appointmentId}/video-token`,
      ),
    enabled: !!appointmentId,
    retry: false,
  });
}
