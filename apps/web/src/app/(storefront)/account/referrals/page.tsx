'use client';

import { useState } from 'react';
import { Copy, Gift, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { REFERRAL_CONFIG, APP_NAME } from '@buymedicines/shared';
import { useApplyReferralCode, useMyReferralCode } from '@/hooks/use-promotions';

export default function ReferralsPage() {
  const { data, isLoading } = useMyReferralCode();
  const applyCode = useApplyReferralCode();
  const [codeInput, setCodeInput] = useState('');

  function copyCode() {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code);
    toast.success('Referral code copied!');
  }

  function shareCode() {
    if (!data?.code) return;
    const shareText = `Use my code ${data.code} on ${APP_NAME} and get ₹${REFERRAL_CONFIG.REFEREE_REWARD} off your first order!`;
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Referral message copied — share it with friends!');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Refer & Earn</h1>

      <Card className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="space-y-3 p-6">
          <Gift className="h-8 w-8" />
          <p className="text-sm opacity-90">
            Share your code — you get ₹{REFERRAL_CONFIG.REFERRER_REWARD} and your friend gets ₹{REFERRAL_CONFIG.REFEREE_REWARD} in
            wallet credit after their first delivered order.
          </p>
          {isLoading ? (
            <p className="text-sm">Loading your code...</p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white/15 px-4 py-2 font-mono text-lg font-bold tracking-wider">{data?.code}</span>
              <Button size="icon" variant="secondary" onClick={copyCode} title="Copy code">
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" onClick={shareCode} title="Share">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">Have a referral code?</h2>
          <p className="text-sm text-muted-foreground">Applied codes can only be used once and not on your own code.</p>
          <div className="flex gap-2">
            <Label className="sr-only">Referral code</Label>
            <Input placeholder="Enter referral code" value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} />
            <Button onClick={() => applyCode.mutate(codeInput)} disabled={!codeInput || applyCode.isPending}>
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
