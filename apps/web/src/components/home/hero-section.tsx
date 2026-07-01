'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PincodeChecker } from './pincode-checker';
import { APP_TAGLINE } from '@buymedicines/shared';

const HIGHLIGHTS = [
  { icon: Truck, label: 'Same-day delivery' },
  { icon: ShieldCheck, label: '100% genuine medicines' },
  { icon: Clock, label: 'Open round the clock' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Your trusted neighbourhood pharmacy
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {APP_TAGLINE}
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Order prescription medicines, healthcare essentials, baby care and personal care products — delivered to
            your doorstep within minutes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/shop">Shop Medicines</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/prescription-upload">Upload Prescription</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <PincodeChecker />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          <div className="glass absolute inset-0 rounded-[2rem] shadow-xl" />
          <div className="absolute inset-6 flex flex-col items-center justify-center gap-3 rounded-3xl bg-card text-center shadow-inner">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
              M
            </span>
            <p className="text-sm font-semibold">10,000+ medicines</p>
            <p className="text-xs text-muted-foreground">across every major category, in stock and ready to ship</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
