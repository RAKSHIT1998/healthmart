'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Wallet, WalletTransaction } from '@/types';

export default function WalletPage() {
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: () => api.get<Wallet>('/wallet') });
  const { data: transactions } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => api.get<WalletTransaction[]>('/wallet/transactions?page=1&limit=20'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Wallet</h1>
      <Card className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="p-6">
          <p className="text-sm opacity-80">Available Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(wallet?.balance ?? 0)}</p>
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
