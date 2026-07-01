'use client';

import { Fragment, useRef, useState } from 'react';
import { RefreshCw, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { useMargLogs, useTriggerMargSync, useUploadMargFile } from '@/hooks/admin/use-marg';

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
  const uploadFile = useUploadMargFile();
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  function handleFileSelected(entity: string, file: File | undefined) {
    if (!file) return;
    uploadFile.mutate({ entity, file });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MARG ERP Integration</h1>
        <p className="text-sm text-muted-foreground">
          Pull medicines, stock, suppliers and push sale invoices to/from Marg ERP.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">How this works</p>
            <Button onClick={() => triggerSync.mutate(undefined)} disabled={triggerSync.isPending} size="sm">
              <RefreshCw className="h-4 w-4" /> Run Full Sync
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            If your Marg installation auto-exports CSV/XLSX files to a watched folder (or you have API/webhook
            credentials configured in the server environment), use <span className="font-medium">Run Full Sync</span>{' '}
            or the per-entity buttons below to pull the latest export. Don&apos;t have that set up yet? Export a file
            from Marg yourself (Item Master / Stock Statement / Ledger Master) and upload it directly below — it will
            be parsed and applied immediately, regardless of server configuration.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Sync from server-configured connection</p>
          <div className="flex flex-wrap gap-2">
            {ENTITIES.map((entity) => (
              <Button key={entity} variant="outline" size="sm" onClick={() => triggerSync.mutate(entity)} disabled={triggerSync.isPending}>
                Sync {entity}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">Or upload a Marg export file directly</p>
          <div className="flex flex-wrap gap-2">
            {ENTITIES.map((entity) => (
              <div key={entity}>
                <input
                  ref={(el) => {
                    fileInputs.current[entity] = el;
                  }}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFileSelected(entity, e.target.files?.[0])}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadFile.isPending}
                  onClick={() => fileInputs.current[entity]?.click()}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload {entity} file
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                  <Fragment key={log.id}>
                    <tr
                      className="cursor-pointer border-b border-border/40"
                      onClick={() => log.errorMessages.length > 0 && setExpandedError(expandedError === log.id ? null : log.id)}
                    >
                      <td className="p-3 capitalize">{log.entity.replace(/_/g, ' ')}</td>
                      <td className="p-3 uppercase">{log.mode}</td>
                      <td className="p-3"><Badge variant={STATUS_VARIANT[log.status] ?? 'secondary'}>{log.status}</Badge></td>
                      <td className="p-3">{log.recordsProcessed}</td>
                      <td className="p-3">
                        {log.recordsFailed > 0 ? <Badge variant="destructive">{log.recordsFailed}</Badge> : log.recordsFailed}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDateTime(log.startedAt)}</td>
                    </tr>
                    {expandedError === log.id && log.errorMessages.length > 0 && (
                      <tr className="border-b border-border/40 bg-destructive/5">
                        <td className="p-3 text-xs text-destructive" colSpan={6}>
                          <ul className="list-inside list-disc space-y-0.5">
                            {log.errorMessages.map((msg, i) => (
                              <li key={i}>{msg}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
