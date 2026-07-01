'use client';

import { Check } from 'lucide-react';
import { Role } from '@buymedicines/shared';
import { Card, CardContent } from '@/components/ui/card';
import { NAV_ITEMS } from '@/components/layout/sidebar';

const ROLE_COLUMNS: Array<{ role: Role; label: string }> = [
  { role: Role.ADMIN, label: 'Admin' },
  { role: Role.MANAGER, label: 'Manager' },
  { role: Role.PHARMACIST, label: 'Pharmacist' },
  { role: Role.INVENTORY_MANAGER, label: 'Inventory Mgr' },
  { role: Role.DELIVERY_BOY, label: 'Delivery Boy' },
];

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Permission Matrix</h1>
        <p className="text-sm text-muted-foreground">
          Derived directly from this app&apos;s navigation/route guards — always reflects what each role can actually
          access, not a separately-maintained document.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Module</th>
                {ROLE_COLUMNS.map((col) => (
                  <th key={col.role} className="p-3 text-center">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NAV_ITEMS.map((item) => (
                <tr key={item.href} className="border-b border-border/40">
                  <td className="p-3 font-medium">{item.label}</td>
                  {ROLE_COLUMNS.map((col) => (
                    <td key={col.role} className="p-3 text-center">
                      {item.roles.includes(col.role) ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Note: this reflects dashboard navigation access. The backend independently enforces the same role checks on
        every API route (see <code>requireRole()</code> middleware), so a hidden nav item can never be bypassed by
        calling the API directly.
      </p>
    </div>
  );
}
