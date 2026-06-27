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
    </div>
  );
}
