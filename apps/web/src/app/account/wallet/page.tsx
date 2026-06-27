'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRedeemGiftCard } from '@/hooks/use-promotions';
import type { Wallet, WalletTransaction } from '@/types';

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: () => api.get<Wallet>('/wallet') });
  const { data: transactions } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => api.get<WalletTransaction[]>('/wallet/transactions?page=1&limit=20'),
  });
  const redeemGiftCard = useRedeemGiftCard();
  const [giftCardCode, setGiftCardCode] = useState('');

  function handleRedeem() {
    redeemGiftCard.mutate(giftCardCode, {
      onSuccess: () => {
        setGiftCardCode('');
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      },
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Wallet</h1>
      <Card className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="p-6">
          <p className="text-sm opacity-80">Available Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(wallet?.balance ?? 0)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Gift className="h-4 w-4" /> Redeem a Gift Card
          </h2>
          <div className="flex gap-2">
            <Label className="sr-only">Gift card code</Label>
            <Input
              placeholder="GIFT-XXXXXXXXXX"
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
            />
            <Button onClick={handleRedeem} disabled={!giftCardCode || redeemGiftCard.isPending}>
              Redeem
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Transaction History</h2>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.reason.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className={`font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-destructive'}`}>
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
