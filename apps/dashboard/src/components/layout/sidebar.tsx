'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgePercent,
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  Newspaper,
  Package,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Stethoscope,
  Truck,
  Users,
  Zap,
} from 'lucide-react';
import { Role } from '@healthmart/shared';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  section: string;
}

/**
 * Single source of truth for "what can each role see" in this app. The
 * Employee Permission Matrix page (`/permissions`) renders this same array
 * so it can never drift out of sync with the sidebar / actual route guards.
 * `section` is purely a sidebar grouping label — unrelated to RBAC.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.MANAGER], section: 'Overview' },
  { href: '/branches', label: 'Branches', icon: Building2, roles: [Role.ADMIN], section: 'Catalog & Stock' },
  { href: '/medicines', label: 'Medicines', icon: Package, roles: [Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER], section: 'Catalog & Stock' },
  { href: '/inventory', label: 'Inventory', icon: Gauge, roles: [Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER], section: 'Catalog & Stock' },
  { href: '/orders', label: 'Orders', icon: ClipboardList, roles: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST], section: 'Operations' },
  { href: '/returns', label: 'Returns', icon: RotateCcw, roles: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST], section: 'Operations' },
  { href: '/prescriptions', label: 'Prescriptions', icon: FileText, roles: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST], section: 'Operations' },
  { href: '/drivers', label: 'Drivers', icon: Truck, roles: [Role.ADMIN, Role.MANAGER], section: 'Operations' },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope, roles: [Role.ADMIN], section: 'Operations' },
  { href: '/deliveries', label: 'My Deliveries', icon: Truck, roles: [Role.DELIVERY_BOY], section: 'Operations' },
  { href: '/my-appointments', label: 'My Appointments', icon: Stethoscope, roles: [Role.DOCTOR], section: 'Operations' },
  { href: '/coupons', label: 'Coupons', icon: BadgePercent, roles: [Role.ADMIN, Role.MANAGER], section: 'Marketing' },
  { href: '/promotions', label: 'Promotions', icon: Zap, roles: [Role.ADMIN, Role.MANAGER], section: 'Marketing' },
  { href: '/blog', label: 'Health Blog', icon: Newspaper, roles: [Role.ADMIN, Role.MANAGER], section: 'Marketing' },
  { href: '/marg', label: 'MARG Sync', icon: RefreshCw, roles: [Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER], section: 'Insights' },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: [Role.ADMIN, Role.MANAGER], section: 'Insights' },
  { href: '/users', label: 'Users', icon: Users, roles: [Role.ADMIN, Role.MANAGER], section: 'Administration' },
  { href: '/permissions', label: 'Permissions', icon: ScrollText, roles: [Role.ADMIN], section: 'Administration' },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: [Role.ADMIN], section: 'Administration' },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const items = NAV_ITEMS.filter((item) => role && item.roles.includes(role as Role));

  const sections = items.reduce<Array<{ section: string; items: NavItem[] }>>((acc, item) => {
    const group = acc.find((g) => g.section === item.section);
    if (group) group.items.push(item);
    else acc.push({ section: item.section, items: [item] });
    return acc;
  }, []);

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-border/60 bg-card md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground shadow-sm shadow-primary/30">
          M
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold">Medicare Admin</p>
          <p className="text-[11px] text-muted-foreground">Control Panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3 pt-4">
        {sections.map((group) => (
          <div key={group.section}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />}
                    <Icon className={cn('h-4 w-4 transition-colors', active && 'text-primary')} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
