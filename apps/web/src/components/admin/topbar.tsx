'use client';

import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun } from 'lucide-react';
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

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-card/80 px-6 backdrop-blur-md">
      <div>
        <p className="text-sm font-semibold">Welcome back, {user?.name}</p>
        <p className="text-xs capitalize text-muted-foreground">{user?.role?.replace(/_/g, ' ')}</p>
      </div>
      <div className="flex items-center gap-3">
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
        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
          {initials(user?.name)}
        </div>
      </div>
    </header>
  );
}
