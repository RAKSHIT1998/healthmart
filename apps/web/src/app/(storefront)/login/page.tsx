'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { REGEX } from '@buymedicines/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerLogin, useCustomerSignup, useForgotPassword, useResetPassword } from '@/hooks/use-auth';

type IdentifierMode = 'phone' | 'email';
type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [identifierMode, setIdentifierMode] = useState<IdentifierMode>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);

  const signup = useCustomerSignup();
  const login = useCustomerLogin();
  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();

  const identifier = useMemo(
    () => (identifierMode === 'phone' ? { phone: phone.trim() } : { email: email.trim().toLowerCase() }),
    [identifierMode, phone, email],
  );

  const isIdentifierValid = identifierMode === 'phone' ? REGEX.PHONE.test(phone.trim()) : REGEX.EMAIL.test(email.trim());
  const isSignupValid = isIdentifierValid && password.trim().length >= 8 && name.trim().length > 1;
  const isLoginValid = isIdentifierValid && password.trim().length >= 8;
  const isResetValid = isIdentifierValid && resetOtp.trim().length === 6 && newPassword.trim().length >= 8;

  function resetForgotPasswordState() {
    setOtpRequested(false);
    setResetOtp('');
    setNewPassword('');
  }

  function switchAuthMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    if (nextMode !== 'forgot-password') resetForgotPasswordState();
  }

  function handleIdentifierModeToggle() {
    setIdentifierMode(identifierMode === 'phone' ? 'email' : 'phone');
    resetForgotPasswordState();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (authMode === 'signup') {
      if (!isSignupValid) return;
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

    if (authMode === 'forgot-password') {
      if (!otpRequested) {
        if (!isIdentifierValid) return;
        forgotPassword.mutate(identifier, {
          onSuccess: () => setOtpRequested(true),
        });
        return;
      }

      if (!isResetValid) return;
      resetPassword.mutate(
        {
          ...identifier,
          otp: resetOtp.trim(),
          newPassword: newPassword.trim(),
        },
        {
          onSuccess: () => {
            setPassword('');
            resetForgotPasswordState();
            switchAuthMode('login');
          },
        },
      );
      return;
    }

    if (!isLoginValid) return;
    login.mutate(
      {
        password: password.trim(),
        ...identifier,
      },
      { onSuccess: () => router.push('/account') },
    );
  }

  const isSubmitting = signup.isPending || login.isPending || forgotPassword.isPending || resetPassword.isPending;

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {authMode === 'signup' ? 'Create your account' : authMode === 'forgot-password' ? 'Reset password' : 'Login'}
          </CardTitle>
          <CardDescription>
            {authMode === 'signup'
              ? 'Sign up once, then use your mobile number or email with password to log in anytime.'
              : authMode === 'forgot-password'
                ? 'Request an OTP and set a new password after verification.'
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

            {authMode === 'forgot-password' ? (
              <>
                {otpRequested ? (
                  <>
                    <div>
                      <Label htmlFor="reset-otp">OTP</Label>
                      <Input
                        id="reset-otp"
                        placeholder="123456"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        maxLength={6}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send a one-time password to your selected mobile number or email.
                  </p>
                )}
              </>
            ) : (
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
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting ||
                (authMode === 'signup' && !isSignupValid) ||
                (authMode === 'login' && !isLoginValid) ||
                (authMode === 'forgot-password' && ((otpRequested && !isResetValid) || (!otpRequested && !isIdentifierValid)))
              }
            >
              {authMode === 'signup'
                ? 'Sign Up'
                : authMode === 'forgot-password'
                  ? otpRequested
                    ? 'Verify OTP & Reset Password'
                    : 'Send Reset OTP'
                  : 'Login'}
            </Button>

            {authMode === 'forgot-password' && otpRequested ? (
              <button
                type="button"
                onClick={() =>
                  forgotPassword.mutate(identifier, {
                    onSuccess: () => setOtpRequested(true),
                  })
                }
                className="w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Resend OTP
              </button>
            ) : null}

            <button type="button" onClick={handleIdentifierModeToggle} className="w-full text-center text-xs text-muted-foreground hover:underline">
              {identifierMode === 'phone' ? 'Use email instead' : 'Use mobile number instead'}
            </button>

            {authMode === 'login' ? (
              <button type="button" onClick={() => switchAuthMode('forgot-password')} className="w-full text-center text-xs text-muted-foreground hover:underline">
                Forgot password?
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => switchAuthMode(authMode === 'login' ? 'signup' : 'login')}
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
