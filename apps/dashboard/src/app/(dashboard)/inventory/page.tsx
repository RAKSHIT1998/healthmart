'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PackagePlus, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  useAllInventory,
  useExpiringSoon,
  useInventoryMovements,
  useInventoryValue,
  useLowStock,
  useReceivePurchase,
} from '@/hooks/use-inventory';
import { useBranches } from '@/hooks/use-catalog';
import { MedicineSearchSelect } from '@/components/medicines/medicine-search-select';
import { MedicineFormDialog } from '@/components/medicines/medicine-form-dialog';

export default function InventoryPage() {
  const [stockPage, setStockPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const { data: allInventory, isLoading: loadingAll } = useAllInventory(stockPage);
  const { data: lowStock, isLoading: loadingLowStock } = useLowStock();
  const { data: expiring, isLoading: loadingExpiring } = useExpiringSoon();
  const { data: movements, isLoading: loadingMovements } = useInventoryMovements(movementsPage);
  const { data: inventoryValue } = useInventoryValue();
  const { data: branches } = useBranches();
  const receivePurchase = useReceivePurchase();

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({ branchId: '', batchNumber: '', expiryDate: '', quantity: '', costPrice: '' });

  function openReceivePurchase(medicine?: { id: string; name: string }) {
    setSelectedMedicine(medicine ?? null);
    setForm({ branchId: '', batchNumber: '', expiryDate: '', quantity: '', costPrice: '' });
    setPurchaseOpen(true);
  }

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
      { onSuccess: () => setPurchaseOpen(false) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage stock across all branches.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openReceivePurchase()}>
            <PackagePlus className="h-4 w-4" /> Receive Purchase
          </Button>
          <Button onClick={() => setProductOpen(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Inventory Value</p>
          <p className="text-2xl font-bold">{formatCurrency(inventoryValue?.value ?? 0)}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="all-stock">
        <TabsList>
          <TabsTrigger value="all-stock">All Stock</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="movements">Movement History</TabsTrigger>
        </TabsList>

        <TabsContent value="all-stock">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Total Qty</th>
                    <th className="p-3">Reserved</th>
                    <th className="p-3">Available</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAll ? (
                    <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading...</td></tr>
                  ) : allInventory && allInventory.items.length > 0 ? (
                    allInventory.items.map((item) => {
                      const medicine = typeof item.medicineId === 'object' ? item.medicineId : null;
                      const branch = typeof item.branchId === 'object' ? item.branchId : null;
                      const available = item.totalQuantity - item.reservedQuantity;
                      return (
                        <tr key={item.id} className="border-b border-border/40">
                          <td className="flex items-center gap-3 p-3">
                            {medicine?.images?.[0] && (
                              <div className="relative h-9 w-9 overflow-hidden rounded-md bg-secondary">
                                <Image src={medicine.images[0]} alt="" fill className="object-contain" />
                              </div>
                            )}
                            <span className="font-medium">{medicine?.name ?? String(item.medicineId)}</span>
                          </td>
                          <td className="p-3">{branch?.name ?? String(item.branchId)}</td>
                          <td className="p-3">{item.totalQuantity}</td>
                          <td className="p-3">{item.reservedQuantity}</td>
                          <td className="p-3">
                            <Badge variant={available <= item.lowStockThreshold ? 'warning' : 'success'}>{available}</Badge>
                          </td>
                          <td className="p-3 text-right">
                            {medicine && (
                              <Button size="sm" variant="outline" onClick={() => openReceivePurchase({ id: medicine.id, name: medicine.name })}>
                                + Stock
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td className="p-4 text-muted-foreground" colSpan={6}>No inventory yet — add a product to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
          {allInventory?.meta.pagination && (
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {allInventory.meta.pagination.page} of {allInventory.meta.pagination.totalPages} ({allInventory.meta.pagination.total} items)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!allInventory.meta.pagination.hasPrevPage} onClick={() => setStockPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!allInventory.meta.pagination.hasNextPage} onClick={() => setStockPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

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

        <TabsContent value="movements">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">By</th>
                    <th className="p-3">When</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMovements ? (
                    <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading...</td></tr>
                  ) : movements && movements.items.length > 0 ? (
                    movements.items.map((m) => {
                      const medicine = typeof m.medicineId === 'object' ? m.medicineId : null;
                      const branch = typeof m.branchId === 'object' ? m.branchId : null;
                      const actor = typeof m.createdBy === 'object' ? m.createdBy : null;
                      const isInbound = ['purchase', 'reservation_release', 'return'].includes(m.type);
                      return (
                        <tr key={m.id} className="border-b border-border/40">
                          <td className="p-3 font-medium">{medicine?.name ?? String(m.medicineId)}</td>
                          <td className="p-3">{branch?.name ?? String(m.branchId)}</td>
                          <td className="p-3">
                            <Badge variant={isInbound ? 'success' : 'secondary'}>{m.type.replace(/_/g, ' ')}</Badge>
                          </td>
                          <td className="p-3">{isInbound ? '+' : '-'}{m.quantity}</td>
                          <td className="p-3 text-xs text-muted-foreground">{actor?.name ?? 'System'}</td>
                          <td className="p-3 text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td className="p-4 text-muted-foreground" colSpan={6}>No stock movements recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
          {movements?.meta.pagination && (
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {movements.meta.pagination.page} of {movements.meta.pagination.totalPages} ({movements.meta.pagination.total} entries)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!movements.meta.pagination.hasPrevPage} onClick={() => setMovementsPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!movements.meta.pagination.hasNextPage} onClick={() => setMovementsPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Purchase Stock</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Medicine</Label>
              <MedicineSearchSelect
                value={selectedMedicine?.name ?? ''}
                onSelect={(medicine) => setSelectedMedicine({ id: medicine.id, name: medicine.name })}
              />
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

      <MedicineFormDialog open={productOpen} onOpenChange={setProductOpen} />
    </div>
  );
}
