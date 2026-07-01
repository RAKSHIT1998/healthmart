'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';
import { Topbar } from '@/components/admin/topbar';
import { useAuthStore } from '@/store/admin-auth-store';
import './admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (hasHydrated && !accessToken && !isLoginPage) router.push('/admin/login');
  }, [hasHydrated, accessToken, router, isLoginPage]);

  // Login page renders without the admin shell
  if (isLoginPage) return <>{children}</>;

  if (!hasHydrated || !accessToken) return null;

  return (
    <div data-admin className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
