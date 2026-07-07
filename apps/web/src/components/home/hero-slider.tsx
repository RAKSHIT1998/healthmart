'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText, Gift, ShoppingBag, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Slide {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  gradient: string;
}

const SLIDES: Slide[] = [
  {
    icon: ShoppingBag,
    eyebrow: 'Trusted neighbourhood pharmacy',
    title: 'Medicines delivered to your door within minutes',
    description: '1,000+ medicines, healthcare devices, baby care and personal care essentials — all in one place.',
    ctaLabel: 'Shop Now',
    ctaHref: '/shop',
    gradient: 'from-primary/90 via-primary/70 to-accent/70',
  },
  {
    icon: FileText,
    eyebrow: 'Prescription medicines made easy',
    title: 'Upload your prescription, we handle the rest',
    description: 'Our pharmacists verify every prescription order for your safety before it ships.',
    ctaLabel: 'Upload Prescription',
    ctaHref: '/prescription-upload',
    gradient: 'from-sky-600/90 via-sky-500/70 to-cyan-500/70',
  },
  {
    icon: Gift,
    eyebrow: 'Refer & Earn',
    title: 'Invite friends, earn 2% wallet credit on their order',
    description: 'Your friend gets 2% credit too on their first order — share your code from your account.',
    ctaLabel: 'Refer a Friend',
    ctaHref: '/account/referrals',
    gradient: 'from-rose-600/90 via-rose-500/70 to-orange-500/70',
  },
  {
    icon: Stethoscope,
    eyebrow: 'Talk to a doctor',
    title: 'Book an online consultation in minutes',
    description: 'Connect with verified doctors for common health concerns, right from home.',
    ctaLabel: 'Consult a Doctor',
    ctaHref: '/doctors',
    gradient: 'from-emerald-600/90 via-emerald-500/70 to-teal-500/70',
  },
];

const AUTO_ADVANCE_MS = 5000;

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index]!;
  const Icon = slide.icon;

  return (
    <section className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative bg-gradient-to-br ${slide.gradient} text-white`}
        >
          <div className="container flex min-h-[280px] flex-col items-center justify-center gap-4 py-14 text-center md:min-h-[340px]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">{slide.eyebrow}</span>
            <h2 className="max-w-2xl text-balance text-2xl font-bold leading-tight md:text-4xl">{slide.title}</h2>
            <p className="max-w-xl text-sm text-white/90 md:text-base">{slide.description}</p>
            <Button size="lg" variant="secondary" asChild className="mt-2">
              <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        aria-label="Previous slide"
        onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Next slide"
        onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </section>
  );
}
