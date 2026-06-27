'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActiveFlashSales } from '@/hooks/use-promotions';

export function FlashSaleBanner() {
  const { data: flashSales } = useActiveFlashSales();

  if (!flashSales || flashSales.length === 0) return null;
  const sale = flashSales[0]!;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="container pt-6">
      <Link
        href="/shop?sortBy=discount"
        className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-3 text-white shadow-md transition-opacity hover:opacity-95"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 fill-white" /> {sale.name} — {sale.items.length} item(s) at flash prices, today only
        </span>
        <span className="text-xs font-medium underline">Shop now</span>
      </Link>
    </motion.div>
  );
}
