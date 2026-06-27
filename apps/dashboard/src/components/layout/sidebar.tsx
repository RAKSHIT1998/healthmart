'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgePercent,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  Package,
  RefreshCw,
  ScrollText,
  Truck,
  Users,
} from 'lucide-react';
import { Role } from '@healthmart/shared';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.MANAGER] },
  { href: '/medicines', label: 'Medicines', icon: Package, roles: [Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER] },
  { href: '/inventory', label: 'Inventory', icon: Gauge, roles: [Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER] },
  { href: '/orders', label: 'Orders', icon: ClipboardList, roles: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST] },
  { href: '/prescriptions', label: 'Prescriptions', icon: FileText, roles: [Role.ADMIN, Role.MANAGER, Role.PHARMACIST] },
  { href: '/coupons', label: 'Coupons', icon: BadgePercent, roles: [Role.ADMIN, Role.MANAGER] },
  { href: '/drivers', label: 'Drivers', icon: Truck, roles: [Role.ADMIN, Role.MANAGER] },
  { href: '/deliveries', label: 'My Deliveries', icon: Truck, roles: [Role.DELIVERY_BOY] },
  { href: '/marg', label: 'MARG Sync', icon: RefreshCw, roles: [Role.ADMIN, Role.MANAGER, Role.INVENTORY_MANAGER] },
  { href: '/users', label: 'Users', icon: Users, roles: [Role.ADMIN, Role.MANAGER] },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: [Role.ADMIN] },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const items = NAV_ITEMS.filter((item) => role && item.roles.includes(role as Role));

  return (
    <aside className="hidden h-screen w-60 flex-col border-r border-border/60 bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border/60 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
          M
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold">Medicare Admin</p>
          <p className="text-[11px] text-muted-foreground">Control Panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
