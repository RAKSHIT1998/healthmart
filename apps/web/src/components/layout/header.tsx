'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, ShoppingCart, User, Upload, X } from 'lucide-react';
import { SearchBar } from './search-bar';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Healthcare', href: '/shop?categoryGroup=healthcare' },
  { label: 'Baby Care', href: '/shop?categoryGroup=baby_care' },
  { label: 'Personal Care', href: '/shop?categoryGroup=personal_care' },
  { label: 'Devices', href: '/shop?categoryGroup=devices' },
  { label: 'Doctors', href: '/doctors' },
  { label: 'Blog', href: '/blog' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: cart } = useCart();
  const accessToken = useAuthStore((s) => s.accessToken);
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center gap-4">
        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            M
          </span>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-base font-bold text-primary">BuyMedicines.store</span>
            <span className="text-[11px] text-muted-foreground">trusted pharmacy, delivered fast</span>
          </div>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <nav className="ml-auto hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Button variant="ghost" size="icon" asChild title="Upload Prescription">
            <Link href="/prescription-upload">
              <Upload className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative" title="Cart">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild title="Account">
            <Link href={accessToken ? '/account' : '/login'}>
              <User className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>

      {mobileOpen && (
        <nav className={cn('flex flex-col gap-1 border-t border-border/60 px-4 py-3 md:hidden')}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
