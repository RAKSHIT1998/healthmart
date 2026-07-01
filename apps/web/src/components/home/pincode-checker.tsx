'use client';

import { useState } from 'react';
import { CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { publicApiFetch } from '@/lib/api';
import type { ServiceabilityCheckResult } from '@buymedicines/shared';

export function PincodeChecker() {
  const [pincode, setPincode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ServiceabilityCheckResult | null>(null);

  async function checkPincode() {
    if (pincode.length !== 6) return;
    setChecking(true);
    setResult(null);
    try {
      const data = await publicApiFetch<ServiceabilityCheckResult>(`/serviceability/check/${pincode}`);
      setResult(data);
    } catch {
      setResult({ serviceable: false, pincode });
    } finally {
      setChecking(false);
    }
  }

  function formatEta(minutes: number): string {
    return minutes < 60 ? `~${minutes} mins` : `~${(minutes / 60).toFixed(1)} hrs`;
  }

  return (
    <div className="max-w-sm">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
              setResult(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && checkPincode()}
            placeholder="Enter delivery pincode"
            className="pl-9"
            maxLength={6}
          />
        </div>
        <Button onClick={checkPincode} disabled={pincode.length !== 6 || checking}>
          {checking ? 'Checking...' : 'Check'}
        </Button>
      </div>

      {result && (
        <p className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${result.serviceable ? 'text-emerald-600' : 'text-amber-600'}`}>
          {result.serviceable ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Delivering to {result.pincode} in {formatEta(result.estimatedDeliveryMinutes ?? 60)}
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              Sorry, we don&apos;t deliver to {result.pincode} yet
            </>
          )}
        </p>
      )}
    </div>
  );
}
