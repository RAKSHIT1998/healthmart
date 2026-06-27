'use client';

import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { useCreateDoctor, useDoctors, type WeeklySlot } from '@/hooks/use-telehealth';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  specialization: '',
  qualification: '',
  experienceYears: '5',
  consultationFee: '500',
  languages: 'English, Hindi',
  supportsVideo: true,
  supportsAudio: true,
};

export default function DoctorsPage() {
  const { data: doctors, isLoading } = useDoctors();
  const createDoctor = useCreateDoctor();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState('30');

  function toggleDay(day: number) {
    setActiveDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function handleSubmit() {
    const weeklySchedule: WeeklySlot[] = Array.from(activeDays).map((dayOfWeek) => ({
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes: Number(slotDuration),
    }));

    createDoctor.mutate(
      {
        ...form,
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
        weeklySchedule,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(EMPTY_FORM);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Doctors</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Onboard Doctor
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors?.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dr. {typeof doctor.userId === 'object' ? doctor.userId.name : ''}</span>
                  <Badge variant={doctor.isActive ? 'success' : 'destructive'}>{doctor.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{doctor.specialization} · {doctor.qualification}</p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {doctor.rating.toFixed(1)}
                  <span className="text-muted-foreground">· {doctor.totalConsultations} consultations</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{formatCurrency(doctor.consultationFee)} / consultation</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Onboard Doctor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10} />
            </div>
            <div>
              <Label>Temporary Password</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Label>Specialization</Label>
              <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="General Physician" />
            </div>
            <div>
              <Label>Qualification</Label>
              <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="MBBS, MD" />
            </div>
            <div>
              <Label>Experience (years)</Label>
              <Input type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
            </div>
            <div>
              <Label>Consultation Fee (₹)</Label>
              <Input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Languages (comma separated)</Label>
              <Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
            </div>

            <div className="sm:col-span-2 rounded-lg border p-3">
              <Label className="mb-2 block">Weekly availability</Label>
              <div className="flex gap-1">
                {DAYS.map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs ${activeDays.has(idx) ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Start</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">End</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Slot (min)</Label>
                  <Input type="number" value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} />
                </div>
              </div>
            </div>

            <Button className="sm:col-span-2" onClick={handleSubmit} disabled={createDoctor.isPending}>
              Onboard Doctor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
