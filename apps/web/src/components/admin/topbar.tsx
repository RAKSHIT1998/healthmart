'use client';

import { useTheme } from 'next-themes';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { AdminNotificationCenter } from '@/components/admin/notification-center';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/admin-auth-store';
import { useLogout } from '@/hooks/admin/use-auth';

function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Topbar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-card/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={onMenuOpen} title="Open menu">
          <Menu className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold">Welcome back, {user?.name}</p>
        <p className="hidden text-xs capitalize text-muted-foreground sm:block">{user?.role?.replace(/_/g, ' ')}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <AdminNotificationCenter />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => logout.mutate()} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
        <div className="ml-1 hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground sm:flex">
          {initials(user?.name)}
        </div>
      </div>
    </header>
  );
}
