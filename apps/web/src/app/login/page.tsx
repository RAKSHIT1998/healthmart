'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRequestOtp, useVerifyOtp } from '@/hooks/use-auth';
import { REGEX } from '@healthmart/shared';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!REGEX.PHONE.test(phone)) return;
    requestOtp.mutate(phone, { onSuccess: () => setStep('otp') });
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    verifyOtp.mutate(
      { phone, otp, name: name || undefined },
      { onSuccess: () => router.push('/account') },
    );
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{step === 'phone' ? 'Login or Sign up' : 'Verify OTP'}</CardTitle>
          <CardDescription>
            {step === 'phone'
              ? 'Enter your mobile number to continue'
              : `We've sent a 6-digit code to ${phone}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={requestOtp.isPending}>
                Send OTP
              </Button>
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
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Change phone number
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
