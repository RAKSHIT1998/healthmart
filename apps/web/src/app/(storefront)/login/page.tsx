'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCustomerLogin, useCustomerSignup } from '@/hooks/use-auth';
import { REGEX } from '@buymedicines/shared';

type IdentifierMode = 'phone' | 'email';
type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [identifierMode, setIdentifierMode] = useState<IdentifierMode>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signup = useCustomerSignup();
  const login = useCustomerLogin();

  const identifier = useMemo(
    () => (identifierMode === 'phone' ? { phone: phone.trim() } : { email: email.trim().toLowerCase() }),
    [identifierMode, phone, email],
  );

  const isIdentifierValid = identifierMode === 'phone' ? REGEX.PHONE.test(phone.trim()) : REGEX.EMAIL.test(email.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isIdentifierValid || password.trim().length < 8) return;

    if (authMode === 'signup') {
      signup.mutate(
        {
          name: name.trim(),
          password: password.trim(),
          ...identifier,
        },
        { onSuccess: () => router.push('/account') },
      );
      return;
    }

    login.mutate(
      {
        password: password.trim(),
        ...identifier,
      },
      { onSuccess: () => router.push('/account') },
    );
  }

  const isSubmitting = signup.isPending || login.isPending;

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{authMode === 'signup' ? 'Create your account' : 'Login'}</CardTitle>
          <CardDescription>
            {authMode === 'signup'
              ? 'Sign up once, then use your mobile number or email with password to log in anytime.'
              : 'Login using your mobile number or email and password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'signup' ? (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            ) : null}

            {identifierMode === 'phone' ? (
              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isIdentifierValid || password.trim().length < 8 || (authMode === 'signup' && !name.trim())}
            >
              {authMode === 'signup' ? 'Sign Up' : 'Login'}
            </Button>

            <button
              type="button"
              onClick={() => setIdentifierMode(identifierMode === 'phone' ? 'email' : 'phone')}
              className="w-full text-center text-xs text-muted-foreground hover:underline"
            >
              {identifierMode === 'phone' ? 'Use email instead' : 'Use mobile number instead'}
            </button>

            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="w-full text-center text-xs text-muted-foreground hover:underline"
            >
              {authMode === 'login' ? 'First time here? Create an account' : 'Already have an account? Login'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
