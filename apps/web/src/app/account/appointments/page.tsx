'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCancelAppointment, useMyAppointments, type Appointment } from '@/hooks/use-telehealth';

const VideoCallRoom = dynamic(() => import('@/components/telehealth/video-call-room').then((m) => m.VideoCallRoom), {
  ssr: false,
  loading: () => <p className="text-sm text-muted-foreground">Loading call...</p>,
});

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  scheduled: 'success',
  in_progress: 'warning',
  completed: 'secondary',
  cancelled: 'destructive',
  pending_payment: 'warning',
};

function canJoin(appointment: Appointment): boolean {
  if (!['scheduled', 'in_progress'].includes(appointment.status)) return false;
  const scheduled = new Date(appointment.scheduledAt).getTime();
  const now = Date.now();
  return now >= scheduled - 10 * 60_000 && now <= scheduled + 60 * 60_000;
}

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = useMyAppointments();
  const cancelAppointment = useCancelAppointment();
  const [activeCall, setActiveCall] = useState<Appointment | null>(null);

  if (activeCall) {
    return (
      <div className="container max-w-3xl py-8">
        <h1 className="mb-4 text-xl font-bold">Consultation in progress</h1>
        <VideoCallRoom appointmentId={activeCall.id} callType={activeCall.type} onLeave={() => setActiveCall(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Appointments</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !appointments || appointments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <Stethoscope className="h-8 w-8" />
          <p>No appointments booked yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {typeof appointment.doctorId === 'object' ? `Dr. ${appointment.doctorId.userId?.name ?? ''}` : 'Doctor'}
                  </span>
                  <Badge variant={STATUS_VARIANT[appointment.status] ?? 'secondary'}>{appointment.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(appointment.scheduledAt)} · {new Date(appointment.scheduledAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · {appointment.type} call
                </p>
                <p className="mt-1 text-sm font-medium">{formatCurrency(appointment.consultationFee)}</p>

                {appointment.status === 'completed' && appointment.diagnosis && (
                  <div className="mt-2 rounded-lg bg-secondary/50 p-3 text-sm">
                    <p className="font-medium">Diagnosis</p>
                    <p className="text-muted-foreground">{appointment.diagnosis}</p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {canJoin(appointment) && (
                    <Button size="sm" onClick={() => setActiveCall(appointment)}>
                      Join Call
                    </Button>
                  )}
                  {appointment.prescriptionPdfUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={appointment.prescriptionPdfUrl} target="_blank" rel="noreferrer">
                        Download Prescription
                      </a>
                    </Button>
                  )}
                  {['pending_payment', 'scheduled'].includes(appointment.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => cancelAppointment.mutate({ id: appointment.id, reason: 'Changed my mind' })}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
