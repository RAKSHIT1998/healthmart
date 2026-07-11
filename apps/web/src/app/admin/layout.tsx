'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { useAuthStore } from '@/store/admin-auth-store';
import { useAdminNotifications } from '@/hooks/admin/use-admin-notifications';
import { NAV_ITEMS } from '@/components/admin/sidebar';
import './admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const role = useAuthStore((s) => s.user?.role);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (hasHydrated && !accessToken && !isLoginPage) router.push('/admin/login');
  }, [hasHydrated, accessToken, router, isLoginPage]);

  useEffect(() => {
    if (!hasHydrated || !accessToken || !role || isLoginPage || pathname === '/admin') return;

    const currentItem = NAV_ITEMS.find((item) => item.href === pathname);
    if (currentItem && !currentItem.roles.includes(role)) {
      const landing = NAV_ITEMS.find((item) => item.roles.includes(role))?.href ?? '/admin/login';
      router.replace(landing);
    }
  }, [hasHydrated, accessToken, role, isLoginPage, pathname, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useAdminNotifications();

  // Login page renders without the admin shell
  if (isLoginPage) return <>{children}</>;

  if (!hasHydrated || !accessToken) return null;

  return (
    <div data-admin className="flex min-h-screen bg-background text-foreground">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1">
        <Topbar onMenuOpen={() => setMobileNavOpen(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
