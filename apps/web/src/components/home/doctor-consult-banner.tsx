import Link from 'next/link';
import { Stethoscope, Video } from 'lucide-react';

export function DoctorConsultBanner() {
  return (
    <section className="container py-10">
      <Link
        href="/doctors"
        className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-primary to-emerald-700 p-6 text-primary-foreground sm:flex-row"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <Stethoscope className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold">Talk to a doctor today</h3>
            <p className="text-sm opacity-90">Video or audio consultations with verified doctors, from home.</p>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium">
          <Video className="h-4 w-4" /> Book a Consultation
        </span>
      </Link>
    </section>
  );
}
