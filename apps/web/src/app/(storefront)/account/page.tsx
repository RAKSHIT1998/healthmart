'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, ApiClientError } from '@/lib/api';
import { useLogout } from '@/hooks/use-auth';
import { useAuthStore, type AuthUser } from '@/store/auth-store';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const logout = useLogout();
  const storedUser = useAuthStore((s) => s.user);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<AuthUser>('/users/me'),
    initialData: storedUser ?? undefined,
  });

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const updateProfile = useMutation({
    mutationFn: () => api.patch('/users/me', { name, email: email || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });

  const updatePreferences = useMutation({
    mutationFn: (notificationPreferences: Record<string, boolean>) =>
      api.patch('/users/me', { notificationPreferences }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Notification preferences updated');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });

  const prefs = user?.notificationPreferences ?? { sms: true, email: true, push: true, whatsapp: true };
  const PREFERENCE_OPTIONS: Array<{ key: keyof typeof prefs; label: string }> = [
    { key: 'sms', label: 'SMS' },
    { key: 'email', label: 'Email' },
    { key: 'push', label: 'Push notifications' },
    { key: 'whatsapp', label: 'WhatsApp' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Profile</h1>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={user?.phone ?? ''} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => logout.mutate()}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <h2 className="font-semibold">Notification Preferences</h2>
            <p className="text-xs text-muted-foreground">Choose which channels we can use to reach you about your orders.</p>
          </div>
          {PREFERENCE_OPTIONS.map((option) => (
            <label key={option.key} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              {option.label}
              <input
                type="checkbox"
                checked={prefs[option.key]}
                onChange={(e) => updatePreferences.mutate({ [option.key]: e.target.checked })}
                disabled={updatePreferences.isPending}
              />
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
