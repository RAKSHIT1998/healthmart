import type { Metadata } from 'next';
import { DoctorsListClient } from './doctors-list-client';

export const metadata: Metadata = {
  title: 'Doctor Consultation',
  description: 'Book a video or audio consultation with verified doctors across specializations.',
};

export default function DoctorsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Consult a Doctor</h1>
      <p className="mt-2 text-muted-foreground">Book a video or audio consultation from the comfort of your home.</p>
      <DoctorsListClient />
    </div>
  );
}
