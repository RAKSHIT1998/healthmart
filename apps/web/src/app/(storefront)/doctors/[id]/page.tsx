'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Star, Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { launchCashfreeCheckout } from '@/lib/cashfree';
import { useBookAppointment, useDoctor, useDoctorAvailability } from '@/hooks/use-telehealth';

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function DoctorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: doctor, isLoading } = useDoctor(params.id);
  const [date, setDate] = useState(todayPlusDays(0));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [type, setType] = useState<'video' | 'audio'>('video');
  const [notes, setNotes] = useState('');
  const { data: slots, isLoading: loadingSlots } = useDoctorAvailability(params.id, date);
  const bookAppointment = useBookAppointment();

  const dateOptions = Array.from({ length: 7 }, (_, i) => todayPlusDays(i));

  async function handleBook() {
    if (!accessToken) {
      router.push('/login');
      return;
    }
    if (!selectedSlot) return;

    const result = await bookAppointment.mutateAsync({
      doctorId: params.id,
      scheduledAt: selectedSlot,
      type,
      notes: notes || undefined,
    });

    await launchCashfreeCheckout(result.paymentSessionId);
  }

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Loading doctor profile...</div>;
  if (!doctor) return <div className="container py-20 text-center text-muted-foreground">Doctor not found</div>;

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardContent className="flex gap-4 p-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {doctor.profileImage ? (
              <Image src={doctor.profileImage} alt="" fill className="object-cover" />
            ) : (
              <Stethoscope className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">Dr. {typeof doctor.userId === 'object' ? doctor.userId.name : ''}</h1>
            <p className="text-sm text-muted-foreground">{doctor.specialization} · {doctor.qualification}</p>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {doctor.rating.toFixed(1)}
              <span className="text-muted-foreground">· {doctor.totalConsultations} consultations · {doctor.experienceYears} yrs experience</span>
            </div>
            {doctor.about && <p className="mt-2 text-sm text-muted-foreground">{doctor.about}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-semibold">Book a consultation</h2>

          <div>
            <p className="mb-2 text-sm font-medium">Consultation type</p>
            <div className="flex gap-2">
              {doctor.supportsVideo && (
                <button
                  onClick={() => setType('video')}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${type === 'video' ? 'border-primary bg-primary/10 text-primary' : 'border-border/60'}`}
                >
                  Video Call
                </button>
              )}
              {doctor.supportsAudio && (
                <button
                  onClick={() => setType('audio')}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${type === 'audio' ? 'border-primary bg-primary/10 text-primary' : 'border-border/60'}`}
                >
                  Audio Call
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Select date</p>
            <div className="flex gap-2 overflow-x-auto">
              {dateOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDate(d);
                    setSelectedSlot(null);
                  }}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs ${date === d ? 'border-primary bg-primary/10 text-primary' : 'border-border/60'}`}
                >
                  {new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Available slots</p>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            ) : !slots || slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No slots available on this date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${selectedSlot === slot ? 'border-primary bg-primary/10 text-primary' : 'border-border/60'}`}
                  >
                    {new Date(slot).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Reason for visit (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <span className="text-lg font-semibold">{formatCurrency(doctor.consultationFee)}</span>
            <Button size="lg" disabled={!selectedSlot || bookAppointment.isPending} onClick={handleBook}>
              Book & Pay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
