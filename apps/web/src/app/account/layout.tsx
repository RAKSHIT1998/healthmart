'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, FileText, Heart, MapPin, Package, User, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/account', label: 'Profile', icon: User },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wallet', label: 'Wallet', icon: Wallet },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/prescriptions', label: 'Prescriptions', icon: FileText },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!accessToken) router.push('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <div className="container grid gap-8 py-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </aside>
      <div>{children}</div>
    </div>
  );
}
