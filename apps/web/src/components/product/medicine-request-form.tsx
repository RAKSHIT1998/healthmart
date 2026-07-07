'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateMedicineRequest } from '@/hooks/use-medicine-requests';

interface MedicineRequestFormProps {
  initialQuery?: string;
}

export function MedicineRequestForm({ initialQuery }: MedicineRequestFormProps) {
  const [medicineName, setMedicineName] = useState(initialQuery ?? '');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const createRequest = useCreateMedicineRequest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) return;
    createRequest.mutate(
      { medicineName: medicineName.trim(), notes: notes.trim() || undefined },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground">
        Got it — we&apos;ll look into sourcing <span className="font-medium text-foreground">{medicineName}</span> and
        notify you once it&apos;s available.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
      <Input
        value={medicineName}
        onChange={(e) => setMedicineName(e.target.value)}
        placeholder="Medicine or product name"
        required
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any details that help us find it (brand, strength, etc.) — optional"
        rows={3}
        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" disabled={createRequest.isPending} className="w-full">
        {createRequest.isPending ? 'Submitting…' : 'Request this medicine'}
      </Button>
    </form>
  );
}
