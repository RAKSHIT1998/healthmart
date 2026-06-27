'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useExpiringSoon, useInventoryValue, useLowStock, useReceivePurchase } from '@/hooks/use-inventory';
import { useBranches } from '@/hooks/use-catalog';
import { MedicineSearchSelect } from '@/components/medicines/medicine-search-select';
import type { Medicine } from '@/types';

export default function InventoryPage() {
  const { data: lowStock, isLoading: loadingLowStock } = useLowStock();
  const { data: expiring, isLoading: loadingExpiring } = useExpiringSoon();
  const { data: inventoryValue } = useInventoryValue();
  const { data: branches } = useBranches();
  const receivePurchase = useReceivePurchase();

  const [open, setOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ branchId: '', batchNumber: '', expiryDate: '', quantity: '', costPrice: '' });

  function handleSubmit() {
    if (!selectedMedicine || !form.branchId) return;
    receivePurchase.mutate(
      {
        medicineId: selectedMedicine.id,
        branchId: form.branchId,
        batchNumber: form.batchNumber,
        expiryDate: new Date(form.expiryDate).toISOString(),
        quantity: Number(form.quantity),
        costPrice: Number(form.costPrice),
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Receive Purchase
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Inventory Value</p>
          <p className="text-2xl font-bold">{formatCurrency(inventoryValue?.value ?? 0)}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="low-stock">
        <TabsList>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>
        <TabsContent value="low-stock">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Total Qty</th>
                    <th className="p-3">Reserved</th>
                    <th className="p-3">Available</th>
                    <th className="p-3">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLowStock ? (
                    <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading...</td></tr>
                  ) : lowStock && lowStock.length > 0 ? (
                    lowStock.map((item) => (
                      <tr key={item.id} className="border-b border-border/40">
                        <td className="p-3 font-medium">{typeof item.medicineId === 'object' ? item.medicineId.name : item.medicineId}</td>
                        <td className="p-3">{item.totalQuantity}</td>
                        <td className="p-3">{item.reservedQuantity}</td>
                        <td className="p-3">
                          <Badge variant="warning">{item.totalQuantity - item.reservedQuantity}</Badge>
                        </td>
                        <td className="p-3">{item.lowStockThreshold}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="p-4 text-muted-foreground" colSpan={5}>No low stock items 🎉</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expiring">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Batch No.</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Qty Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingExpiring ? (
                    <tr><td className="p-4 text-muted-foreground" colSpan={4}>Loading...</td></tr>
                  ) : expiring && expiring.length > 0 ? (
                    expiring.map((batch) => (
                      <tr key={batch.id} className="border-b border-border/40">
                        <td className="p-3 font-medium">{typeof batch.medicineId === 'object' ? batch.medicineId.name : batch.medicineId}</td>
                        <td className="p-3">{batch.batchNumber}</td>
                        <td className="p-3">
                          <Badge variant="destructive">{formatDate(batch.expiryDate)}</Badge>
                        </td>
                        <td className="p-3">{batch.quantityRemaining}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="p-4 text-muted-foreground" colSpan={4}>No batches expiring soon</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Purchase Stock</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Medicine</Label>
              <MedicineSearchSelect value={selectedMedicine?.name ?? ''} onSelect={setSelectedMedicine} />
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Batch Number</Label>
                <Input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Cost Price (₹)</Label>
                <Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={receivePurchase.isPending}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
