'use client';

import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/hooks/use-auth';

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-card px-6">
      <div>
        <p className="text-sm font-semibold">Welcome back, {user?.name}</p>
        <p className="text-xs capitalize text-muted-foreground">{user?.role?.replace(/_/g, ' ')}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => logout.mutate()} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
