'use client';

import { useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { MedicineSearchSelect } from '@/components/medicines/medicine-search-select';
import {
  useCreateFlashSale,
  useFlashSales,
  useIssueGiftCard,
  useIssuedGiftCards,
  useToggleFlashSale,
  type FlashSaleItem,
} from '@/hooks/use-promotions';
import type { Medicine } from '@/types';

function FlashSalesTab() {
  const { data: flashSales, isLoading } = useFlashSales();
  const createFlashSale = useCreateFlashSale();
  const toggleFlashSale = useToggleFlashSale();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [items, setItems] = useState<Array<FlashSaleItem & { name: string }>>([]);
  const [pendingMedicine, setPendingMedicine] = useState<Medicine | null>(null);
  const [pendingPrice, setPendingPrice] = useState('');

  function addItem() {
    if (!pendingMedicine || !pendingPrice) return;
    setItems((prev) => [...prev, { medicineId: pendingMedicine.id, name: pendingMedicine.name, flashPrice: Number(pendingPrice) }]);
    setPendingMedicine(null);
    setPendingPrice('');
  }

  function handleSubmit() {
    if (!name || !startAt || !endAt || items.length === 0) return;
    createFlashSale.mutate(
      {
        name,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        items: items.map(({ medicineId, flashPrice }) => ({ medicineId, flashPrice })),
        isActive: true,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setStartAt('');
          setEndAt('');
          setItems([]);
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create Flash Sale
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {flashSales?.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <Zap className="h-4 w-4 text-amber-500" /> {sale.name}
                  </span>
                  <Badge variant={sale.isActive ? 'success' : 'secondary'}>{sale.isActive ? 'Active' : 'Disabled'}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(sale.startAt)} → {formatDateTime(sale.endAt)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{sale.items.length} item(s)</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => toggleFlashSale.mutate({ id: sale.id, isActive: !sale.isActive })}
                >
                  {sale.isActive ? 'Disable' : 'Enable'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Flash Sale</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekend Flash Sale" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start</Label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <Label>Add item</Label>
              <div className="mt-1 flex gap-2">
                <div className="flex-1">
                  <MedicineSearchSelect value={pendingMedicine?.name ?? ''} onSelect={setPendingMedicine} />
                </div>
                <Input
                  type="number"
                  placeholder="Flash price"
                  className="w-32"
                  value={pendingPrice}
                  onChange={(e) => setPendingPrice(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={addItem} disabled={!pendingMedicine || !pendingPrice}>
                  Add
                </Button>
              </div>

              {items.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {items.map((item, idx) => (
                    <li key={`${item.medicineId}-${idx}`} className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="flex items-center gap-2">
                        {formatCurrency(item.flashPrice)}
                        <button onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={createFlashSale.isPending || items.length === 0}>
              Create Flash Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GiftCardsTab() {
  const { data, isLoading } = useIssuedGiftCards(1);
  const issueGiftCard = useIssueGiftCard();
  const [open, setOpen] = useState(false);
  const [initialValue, setInitialValue] = useState('');
  const [issuedToEmail, setIssuedToEmail] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    issueGiftCard.mutate(
      { initialValue: Number(initialValue), issuedToEmail: issuedToEmail || undefined, notes: notes || undefined },
      { onSuccess: () => { setOpen(false); setInitialValue(''); setIssuedToEmail(''); setNotes(''); } },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Issue Gift Card
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Value</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3">Issued</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading...</td></tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((card) => (
                  <tr key={card.id} className="border-b border-border/40">
                    <td className="p-3 font-mono">{card.code}</td>
                    <td className="p-3">{formatCurrency(card.initialValue)}</td>
                    <td className="p-3">{formatCurrency(card.balance)}</td>
                    <td className="p-3">
                      <Badge variant={card.redeemedBy ? 'secondary' : 'success'}>{card.redeemedBy ? 'Redeemed' : 'Active'}</Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDateTime(card.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={5}>No gift cards issued yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Gift Card</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Value (₹)</Label>
              <Input type="number" value={initialValue} onChange={(e) => setInitialValue(e.target.value)} />
            </div>
            <div>
              <Label>Recipient Email (optional)</Label>
              <Input type="email" value={issuedToEmail} onChange={(e) => setIssuedToEmail(e.target.value)} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button onClick={handleSubmit} disabled={!initialValue || issueGiftCard.isPending}>
              Issue Gift Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Promotions</h1>
      <Tabs defaultValue="flash-sales">
        <TabsList>
          <TabsTrigger value="flash-sales">Flash Sales</TabsTrigger>
          <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
        </TabsList>
        <TabsContent value="flash-sales">
          <FlashSalesTab />
        </TabsContent>
        <TabsContent value="gift-cards">
          <GiftCardsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
