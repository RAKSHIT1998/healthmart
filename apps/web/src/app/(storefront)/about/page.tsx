import type { Metadata } from 'next';
import { ShieldCheck, Truck, Users } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@buymedicines/shared';

export const metadata: Metadata = {
  title: 'About Us',
  description: `Learn about ${APP_NAME} — our mission, values, and commitment to delivering genuine medicines fast.`,
};

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">About {APP_NAME}</h1>
      <p className="mt-4 text-muted-foreground">{APP_TAGLINE}</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          {APP_NAME} was built to make essential healthcare accessible to every household, without the wait. We
          partner with licensed pharmacies and verified distributors to bring genuine, quality-checked medicines and
          healthcare products to your doorstep — fast.
        </p>
        <p>
          From prescription medicines to baby care, personal care and healthcare devices, our catalog is curated and
          continuously verified for authenticity. Every prescription-only order is reviewed by a licensed pharmacist
          before it ships.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 p-5">
          <Truck className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-semibold">Fast Delivery</h3>
          <p className="mt-1 text-sm text-muted-foreground">Same-day and express delivery across serviceable areas.</p>
        </div>
        <div className="rounded-xl border border-border/60 p-5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-semibold">Genuine Products</h3>
          <p className="mt-1 text-sm text-muted-foreground">Sourced only from licensed manufacturers and distributors.</p>
        </div>
        <div className="rounded-xl border border-border/60 p-5">
          <Users className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-semibold">Pharmacist Verified</h3>
          <p className="mt-1 text-sm text-muted-foreground">Every prescription order is reviewed by a licensed pharmacist.</p>
        </div>
      </div>
    </div>
  );
}
