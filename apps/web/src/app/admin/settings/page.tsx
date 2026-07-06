'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useOtpBypass, useSetOtpBypass } from '@/hooks/admin/use-system-settings';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { data, isLoading } = useOtpBypass();
  const setOtpBypass = useSetOtpBypass();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">System-wide toggles for admins.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">OTP Bypass (Temporary)</p>
              <p className="text-xs text-muted-foreground">
                While enabled, any 6-digit code will be accepted for phone/email login — use only while SMS/email
                delivery is unavailable.
              </p>
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-9 rounded-full" />
            ) : (
              <Switch
                checked={data?.enabled ?? false}
                onCheckedChange={(checked) => setOtpBypass.mutate(checked)}
                disabled={setOtpBypass.isPending}
              />
            )}
          </div>

          {data?.enabled && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Security risk: with this on, anyone who knows a customer&apos;s phone number or email can log into
                their account with any correctly-formatted code — no real verification happens. Turn this off the
                moment MSG91/Resend delivery is configured and working.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
