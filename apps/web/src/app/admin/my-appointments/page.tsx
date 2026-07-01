'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useCompleteConsultation, useMyDoctorAppointments, type Appointment } from '@/hooks/admin/use-telehealth';

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

export default function MyAppointmentsPage() {
  const { data, isLoading } = useMyDoctorAppointments(1);
  const [activeCall, setActiveCall] = useState<Appointment | null>(null);
  const [completing, setCompleting] = useState<Appointment | null>(null);

  if (activeCall) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-xl font-bold">Consultation in progress</h1>
        <VideoCallRoom appointmentId={activeCall.id} callType={activeCall.type} onLeave={() => setActiveCall(null)} />
        <Button onClick={() => setCompleting(activeCall)}>Complete Consultation & Issue Prescription</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Appointments</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No appointments scheduled.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {typeof appointment.patientId === 'object' ? appointment.patientId.name : 'Patient'}
                  </span>
                  <Badge variant={STATUS_VARIANT[appointment.status] ?? 'secondary'}>{appointment.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(appointment.scheduledAt)} · {appointment.type} call</p>
                <p className="mt-1 text-sm font-medium">{formatCurrency(appointment.consultationFee)}</p>
                {appointment.notes && <p className="mt-1 text-xs italic text-muted-foreground">&ldquo;{appointment.notes}&rdquo;</p>}

                <div className="mt-3 flex gap-2">
                  {canJoin(appointment) && (
                    <Button size="sm" onClick={() => setActiveCall(appointment)}>
                      Join Call
                    </Button>
                  )}
                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <Button size="sm" variant="outline" onClick={() => setCompleting(appointment)}>
                      Complete & Prescribe
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CompleteConsultationDialog appointment={completing} onClose={() => setCompleting(null)} />
    </div>
  );
}

function CompleteConsultationDialog({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const completeConsultation = useCompleteConsultation();
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; instructions: string }>>([
    { name: '', dosage: '', instructions: '' },
  ]);

  function updateMedicine(idx: number, field: 'name' | 'dosage' | 'instructions', value: string) {
    setMedicines((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  function handleSubmit() {
    if (!appointment || !diagnosis.trim()) return;
    completeConsultation.mutate(
      {
        id: appointment.id,
        diagnosis,
        prescribedMedicines: medicines.filter((m) => m.name.trim()),
      },
      {
        onSuccess: () => {
          setDiagnosis('');
          setMedicines([{ name: '', dosage: '', instructions: '' }]);
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Consultation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Diagnosis</Label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm"
              rows={3}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Prescribed Medicines</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMedicines((prev) => [...prev, { name: '', dosage: '', instructions: '' }])}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {medicines.map((med, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  <Input placeholder="Medicine name" value={med.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} />
                  <Input placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} />
                  <Input placeholder="Instructions" value={med.instructions} onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)} />
                  <Button type="button" size="icon" variant="ghost" onClick={() => setMedicines((prev) => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={!diagnosis.trim() || completeConsultation.isPending}>
            Complete & Generate Prescription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
