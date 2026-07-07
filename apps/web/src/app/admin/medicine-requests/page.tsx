'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils';
import { useAllMedicineRequests, useUpdateMedicineRequest, type AdminMedicineRequest } from '@/hooks/admin/use-medicine-requests';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'secondary',
  sourcing: 'warning',
  added: 'success',
  declined: 'destructive',
};

function RequestRow({ r }: { r: AdminMedicineRequest }) {
  const customer = typeof r.userId === 'object' ? r.userId : null;
  const updateRequest = useUpdateMedicineRequest();

  return (
    <tr className="border-b border-border/40">
      <td className="p-3 font-medium">{r.medicineName}</td>
      <td className="p-3">{customer?.name ?? String(r.userId)}</td>
      <td className="p-3 text-xs text-muted-foreground">{r.notes || '—'}</td>
      <td className="p-3">
        <Select
          value={r.status}
          onValueChange={(status) => updateRequest.mutate({ id: r.id, status: status as AdminMedicineRequest['status'] })}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sourcing">Sourcing</SelectItem>
            <SelectItem value="added">Added</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-3 text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</td>
    </tr>
  );
}

export default function MedicineRequestsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const { data, isLoading } = useAllMedicineRequests(page, statusFilter === 'all' ? undefined : statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Medicine Requests</h1>
        <p className="text-sm text-muted-foreground">
          Medicines/products customers couldn&apos;t find in the catalog. Review and update status as you source them.
        </p>
      </div>

      <div className="w-56">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sourcing">Sourcing</SelectItem>
            <SelectItem value="added">Added</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Medicine</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requested</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading...</td></tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((r) => <RequestRow key={r.id} r={r} />)
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={5}>No medicine requests.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {data?.meta.pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.meta.pagination.page} of {data.meta.pagination.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!data.meta.pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!data.meta.pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
