'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'How fast is delivery?',
    a: 'Most orders within our serviceable pincodes are delivered the same day. Express slots deliver in under 60 minutes, subject to availability.',
  },
  {
    q: 'Do I need a prescription to order medicines?',
    a: 'Schedule H, H1 and X drugs require a valid prescription. Upload it during checkout or from the "Upload Prescription" page — our pharmacist will verify it before the order is packed.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support UPI, cards, net banking and wallets via Cashfree, plus Cash on Delivery and wallet balance.',
  },
  {
    q: 'Can I return medicines?',
    a: 'Unopened, undamaged medicines can be returned within 7 days as per our refund policy. Temperature-sensitive items and opened strips are non-returnable for safety reasons.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="container py-12">
      <h2 className="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
      <div className="mx-auto max-w-2xl divide-y divide-border rounded-xl border border-border/60 bg-card">
        {FAQS.map((faq, index) => (
          <div key={faq.q}>
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium"
            >
              {faq.q}
              <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', openIndex === index && 'rotate-180')} />
            </button>
            {openIndex === index && <p className="px-5 pb-4 text-sm text-muted-foreground">{faq.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
