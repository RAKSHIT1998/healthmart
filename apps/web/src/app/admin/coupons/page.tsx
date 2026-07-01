'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCoupons, useCreateCoupon, useDeleteCoupon } from '@/hooks/admin/use-coupons';

export default function CouponsPage() {
  const { data: coupons, isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'flat' as 'flat' | 'percentage' | 'free_delivery',
    value: '',
    minOrderValue: '0',
    usageLimitPerUser: '1',
    validFrom: new Date().toISOString().slice(0, 10),
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  function handleSubmit() {
    createCoupon.mutate(
      {
        code: form.code,
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value),
        minOrderValue: Number(form.minOrderValue),
        usageLimitPerUser: Number(form.usageLimitPerUser),
        validFrom: new Date(form.validFrom).toISOString(),
        validTill: new Date(form.validTill).toISOString(),
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons?.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold">{coupon.code}</span>
                  <Badge variant={coupon.isActive ? 'success' : 'destructive'}>{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{coupon.description}</p>
                <p className="mt-2 text-sm">
                  {coupon.type === 'flat' && `${formatCurrency(coupon.value)} off`}
                  {coupon.type === 'percentage' && `${coupon.value}% off`}
                  {coupon.type === 'free_delivery' && 'Free delivery'}
                  {coupon.minOrderValue > 0 && ` on orders above ${formatCurrency(coupon.minOrderValue)}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Valid till {formatDate(coupon.validTill)} · Used {coupon.usedCount} times
                </p>
                <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => deleteCoupon.mutate(coupon.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Deactivate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Discount</SelectItem>
                  <SelectItem value="percentage">Percentage Discount</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Value</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div>
                <Label>Min Order Value</Label>
                <Input type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
              </div>
              <div>
                <Label>Valid From</Label>
                <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div>
                <Label>Valid Till</Label>
                <Input type="date" value={form.validTill} onChange={(e) => setForm({ ...form, validTill: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={createCoupon.isPending}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
