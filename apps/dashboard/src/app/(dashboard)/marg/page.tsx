'use client';

import { RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { useMargLogs, useTriggerMargSync } from '@/hooks/use-marg';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  success: 'success',
  partial: 'warning',
  failed: 'destructive',
  running: 'secondary',
};

const ENTITIES = ['medicine', 'stock', 'supplier', 'customer'];

export default function MargSyncPage() {
  const { data, isLoading } = useMargLogs(1);
  const triggerSync = useTriggerMargSync();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MARG ERP Sync</h1>
          <p className="text-sm text-muted-foreground">
            Pull medicines, stock, suppliers and push sale invoices to/from Marg ERP.
          </p>
        </div>
        <Button onClick={() => triggerSync.mutate(undefined)} disabled={triggerSync.isPending}>
          <RefreshCw className="h-4 w-4" /> Run Full Sync
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ENTITIES.map((entity) => (
          <Button key={entity} variant="outline" size="sm" onClick={() => triggerSync.mutate(entity)} disabled={triggerSync.isPending}>
            Sync {entity}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Entity</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Status</th>
                <th className="p-3">Processed</th>
                <th className="p-3">Failed</th>
                <th className="p-3">Started</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading...</td></tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((log) => (
                  <tr key={log.id} className="border-b border-border/40">
                    <td className="p-3 capitalize">{log.entity.replace(/_/g, ' ')}</td>
                    <td className="p-3 uppercase">{log.mode}</td>
                    <td className="p-3"><Badge variant={STATUS_VARIANT[log.status] ?? 'secondary'}>{log.status}</Badge></td>
                    <td className="p-3">{log.recordsProcessed}</td>
                    <td className="p-3">{log.recordsFailed}</td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDateTime(log.startedAt)}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={6}>No sync runs yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
