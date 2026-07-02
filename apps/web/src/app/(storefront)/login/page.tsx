'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRequestOtp, useVerifyOtp } from '@/hooks/use-auth';
import { REGEX, OTP_CONFIG } from '@buymedicines/shared';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const identifier = mode === 'phone' ? { phone } : { email };

  function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'phone' ? !REGEX.PHONE.test(phone) : !REGEX.EMAIL.test(email)) return;
    requestOtp.mutate(identifier, {
      onSuccess: () => {
        setStep('otp');
        setResendCooldown(OTP_CONFIG.RESEND_COOLDOWN_SECONDS);
      },
    });
  }

  function handleResendOtp() {
    if (resendCooldown > 0) return;
    requestOtp.mutate(identifier, { onSuccess: () => setResendCooldown(OTP_CONFIG.RESEND_COOLDOWN_SECONDS) });
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    verifyOtp.mutate(
      { ...identifier, otp, name: name || undefined },
      { onSuccess: () => router.push('/account') },
    );
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{step === 'identifier' ? 'Login or Sign up' : 'Verify OTP'}</CardTitle>
          <CardDescription>
            {step === 'identifier'
              ? mode === 'phone'
                ? 'Enter your mobile number to continue'
                : 'Enter your email to continue'
              : `We've sent a 6-digit code to ${mode === 'phone' ? phone : email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'identifier' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {mode === 'phone' ? (
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
              <Button type="submit" className="w-full" disabled={requestOtp.isPending}>
                Send OTP
              </Button>
              <button
                type="button"
                onClick={() => setMode(mode === 'phone' ? 'email' : 'phone')}
                className="w-full text-center text-xs text-muted-foreground hover:underline"
              >
                {mode === 'phone' ? 'Use email instead' : 'Use phone number instead'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Your Name (first time only)</Label>
                <Input id="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={verifyOtp.isPending}>
                Verify & Continue
              </Button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || requestOtp.isPending}
                className="w-full text-center text-xs text-muted-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('identifier');
                  setResendCooldown(0);
                }}
                className="w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Change {mode === 'phone' ? 'phone number' : 'email'}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
