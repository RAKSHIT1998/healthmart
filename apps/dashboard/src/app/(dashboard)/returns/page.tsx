'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useAllReturns, useProcessReturn, useReturnQueue } from '@/hooks/use-returns';
import type { ReturnRequest } from '@/types';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  requested: 'secondary',
  approved: 'warning',
  refunded: 'success',
  rejected: 'destructive',
};

function ReturnRow({ r, onProcess }: { r: ReturnRequest; onProcess: (r: ReturnRequest, action: 'approve' | 'reject') => void }) {
  const order = typeof r.orderId === 'object' ? r.orderId : null;
  const customer = typeof r.userId === 'object' ? r.userId : null;

  return (
    <tr className="border-b border-border/40">
      <td className="p-3 font-medium">{order?.orderNumber ?? String(r.orderId)}</td>
      <td className="p-3">{customer?.name ?? String(r.userId)}</td>
      <td className="p-3">
        <div className="space-y-0.5 text-xs">
          {r.items.map((item) => (
            <div key={item.medicineId}>{item.name} × {item.quantity}</div>
          ))}
        </div>
      </td>
      <td className="p-3 capitalize">{r.reasonCategory.replace(/_/g, ' ')}</td>
      <td className="p-3 font-medium">{formatCurrency(r.refundAmount)}</td>
      <td className="p-3"><Badge variant={STATUS_VARIANT[r.status] ?? 'secondary'}>{r.status}</Badge></td>
      <td className="p-3 text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</td>
      <td className="p-3 text-right">
        {r.status === 'requested' && (
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => onProcess(r, 'approve')}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => onProcess(r, 'reject')}>Reject</Button>
          </div>
        )}
        {r.status === 'rejected' && r.rejectionReason && (
          <span className="text-xs text-muted-foreground">{r.rejectionReason}</span>
        )}
      </td>
    </tr>
  );
}

export default function ReturnsPage() {
  const [queuePage, setQueuePage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: queue, isLoading: loadingQueue } = useReturnQueue(queuePage);
  const { data: allReturns, isLoading: loadingAll } = useAllReturns(allPage, statusFilter === 'all' ? undefined : statusFilter);
  const processReturn = useProcessReturn();

  const [dialogReturn, setDialogReturn] = useState<ReturnRequest | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject'>('approve');
  const [refundMethod, setRefundMethod] = useState<'wallet' | 'original_payment'>('wallet');
  const [rejectionReason, setRejectionReason] = useState('');

  function openProcessDialog(r: ReturnRequest, action: 'approve' | 'reject') {
    setDialogReturn(r);
    setDialogAction(action);
    setRefundMethod('wallet');
    setRejectionReason('');
  }

  function handleConfirm() {
    if (!dialogReturn) return;
    processReturn.mutate(
      {
        id: dialogReturn.id,
        action: dialogAction,
        refundMethod: dialogAction === 'approve' ? refundMethod : undefined,
        rejectionReason: dialogAction === 'reject' ? rejectionReason : undefined,
      },
      { onSuccess: () => setDialogReturn(null) },
    );
  }

  function renderTable(items: ReturnRequest[] | undefined, isLoading: boolean) {
    return (
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Refund</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requested</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={8}>Loading...</td></tr>
              ) : items && items.length > 0 ? (
                items.map((r) => <ReturnRow key={r.id} r={r} onProcess={openProcessDialog} />)
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={8}>No return requests.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Returns</h1>
        <p className="text-sm text-muted-foreground">Review return requests, approve refunds, or reject with a reason.</p>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Pending Review</TabsTrigger>
          <TabsTrigger value="all">All Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          {renderTable(queue?.items, loadingQueue)}
          {queue?.meta.pagination && (
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {queue.meta.pagination.page} of {queue.meta.pagination.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!queue.meta.pagination.hasPrevPage} onClick={() => setQueuePage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!queue.meta.pagination.hasNextPage} onClick={() => setQueuePage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <div className="mb-3 w-56">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderTable(allReturns?.items, loadingAll)}
          {allReturns?.meta.pagination && (
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {allReturns.meta.pagination.page} of {allReturns.meta.pagination.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!allReturns.meta.pagination.hasPrevPage} onClick={() => setAllPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!allReturns.meta.pagination.hasNextPage} onClick={() => setAllPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!dialogReturn} onOpenChange={(open) => !open && setDialogReturn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogAction === 'approve' ? 'Approve Return & Refund' : 'Reject Return Request'}</DialogTitle>
          </DialogHeader>
          {dialogReturn && (
            <div className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                Refund amount: <span className="font-semibold text-foreground">{formatCurrency(dialogReturn.refundAmount)}</span>
              </p>
              {dialogAction === 'approve' ? (
                <div>
                  <Label>Refund Method</Label>
                  <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as 'wallet' | 'original_payment')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wallet">Credit to Wallet</SelectItem>
                      <SelectItem value="original_payment">Refund to Original Payment Method</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Restocks the returned quantity automatically. Original payment refund only works for
                    Cashfree-paid orders — COD/wallet orders always settle to wallet.
                  </p>
                </div>
              ) : (
                <div>
                  <Label>Rejection Reason</Label>
                  <Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Item must be returned within 7 days" />
                </div>
              )}
              <Button onClick={handleConfirm} disabled={processReturn.isPending} variant={dialogAction === 'reject' ? 'destructive' : 'default'}>
                Confirm {dialogAction === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
