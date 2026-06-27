'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetchWithMeta } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { AuditLogEntry } from '@/types';

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiFetchWithMeta<AuditLogEntry>('/audit-logs?page=1&limit=50'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={4}>Loading...</td></tr>
              ) : (
                data?.items.map((log) => (
                  <tr key={log.id} className="border-b border-border/40">
                    <td className="p-3">{typeof log.actorId === 'object' ? log.actorId.name : log.actorRole ?? 'System'}</td>
                    <td className="p-3"><Badge variant="secondary">{log.action}</Badge></td>
                    <td className="p-3">{log.entityType}</td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
