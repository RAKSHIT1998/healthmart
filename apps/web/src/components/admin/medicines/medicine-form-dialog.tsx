'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBranches, useCategories, useManufacturers } from '@/hooks/admin/use-catalog';
import { useCreateMedicine, useUpdateMedicine } from '@/hooks/admin/use-medicines';
import { useReceivePurchase } from '@/hooks/admin/use-inventory';
import type { Medicine } from '@/types/admin';

interface MedicineFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine?: Medicine | null;
}

const MEDICINE_TYPES = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'device', 'other'];
const SCHEDULE_CLASSES = ['none', 'schedule_h', 'schedule_h1', 'schedule_x', 'schedule_g'];
const CATEGORY_GROUPS = ['medicine', 'healthcare', 'baby_care', 'personal_care', 'devices'];

function defaultExpiryDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function defaultBatchNumber(): string {
  return `INITIAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
}

function emptyStock() {
  return { branchId: '', batchNumber: defaultBatchNumber(), expiryDate: defaultExpiryDate(), quantity: '', costPrice: '' };
}

export function MedicineFormDialog({ open, onOpenChange, medicine }: MedicineFormDialogProps) {
  const { data: categories } = useCategories();
  const { data: manufacturers } = useManufacturers();
  const { data: branches } = useBranches();
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const receivePurchase = useReceivePurchase();

  const [form, setForm] = useState({
    name: '',
    description: '',
    composition: '',
    manufacturerId: '',
    categoryId: '',
    categoryGroup: 'medicine',
    medicineType: 'tablet',
    scheduleClass: 'none',
    prescriptionRequired: false,
    isGeneric: false,
    mrp: '',
    sellingPrice: '',
    gstPercentage: '12',
    hsnCode: '3004',
    packSize: '',
    images: [] as string[],
  });
  const [stock, setStock] = useState(emptyStock());

  useEffect(() => {
    if (medicine) {
      setForm({
        name: medicine.name,
        description: medicine.description,
        composition: medicine.composition.join(', '),
        manufacturerId: typeof medicine.manufacturerId === 'object' ? medicine.manufacturerId.id : medicine.manufacturerId,
        categoryId: typeof medicine.categoryId === 'object' ? medicine.categoryId.id : medicine.categoryId,
        categoryGroup: medicine.categoryGroup,
        medicineType: medicine.medicineType,
        scheduleClass: medicine.scheduleClass,
        prescriptionRequired: medicine.prescriptionRequired,
        isGeneric: medicine.isGeneric,
        mrp: String(medicine.mrp),
        sellingPrice: String(medicine.sellingPrice),
        gstPercentage: String(medicine.gstPercentage),
        hsnCode: medicine.hsnCode,
        packSize: medicine.packSize,
        images: medicine.images,
      });
    } else {
      setForm((f) => ({ ...f, name: '', description: '', composition: '', mrp: '', sellingPrice: '', images: [] }));
      // Pre-fill branch when there's just one — the common single-pharmacy case — so a quick
      // add only needs a quantity typed in, not a branch lookup.
      setStock({ ...emptyStock(), branchId: branches?.length === 1 ? branches[0]!.id : '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicine, open]);

  async function handleSubmit() {
    if (!form.name.trim()) return;
    if (form.images.length === 0) {
      toast.error('Add at least one photo before saving');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description.trim() || `${form.name} — quality assured, ready to ship.`,
      composition: form.composition.trim()
        ? form.composition.split(',').map((s) => s.trim()).filter(Boolean)
        : [form.name],
      uses: [],
      sideEffects: [],
      manufacturerId: form.manufacturerId,
      categoryId: form.categoryId,
      categoryGroup: form.categoryGroup,
      medicineType: form.medicineType,
      scheduleClass: form.scheduleClass,
      prescriptionRequired: form.prescriptionRequired,
      isGeneric: form.isGeneric,
      mrp: Number(form.mrp),
      sellingPrice: Number(form.sellingPrice),
      gstPercentage: Number(form.gstPercentage),
      hsnCode: form.hsnCode,
      packSize: form.packSize,
      images: form.images,
    };

    if (medicine) {
      updateMedicine.mutate({ id: medicine.id, input: payload }, { onSuccess: () => onOpenChange(false) });
      return;
    }

    try {
      const created = await createMedicine.mutateAsync(payload);
      if (stock.branchId && stock.quantity) {
        await receivePurchase.mutateAsync({
          medicineId: created.id,
          branchId: stock.branchId,
          batchNumber: stock.batchNumber || 'INITIAL',
          expiryDate: new Date(stock.expiryDate || Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: Number(stock.quantity),
          costPrice: Number(stock.costPrice || 0),
        });
      }
      onOpenChange(false);
    } catch {
      // Error toast already shown by the createMedicine/receivePurchase mutation hooks.
    }
  }

  const isNewProduct = !medicine;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{medicine ? 'Edit Medicine' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        {isNewProduct && (
          <p className="-mt-2 text-xs text-muted-foreground">
            Only the starred fields are required — everything else has a sensible default and can be refined later.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>

          <div className="sm:col-span-2">
            <Label>Photos *</Label>
            <ImageUpload images={form.images} onChange={(images) => setForm({ ...form, images })} />
          </div>

          <div>
            <Label>Manufacturer *</Label>
            <Select value={form.manufacturerId} onValueChange={(v) => setForm({ ...form, manufacturerId: v })}>
              <SelectTrigger><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
              <SelectContent>
                {manufacturers?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category *</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>MRP (₹) *</Label>
            <Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
          </div>
          <div>
            <Label>Selling Price (₹) *</Label>
            <Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          </div>
          <div>
            <Label>Pack Size *</Label>
            <Input value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} placeholder="e.g. 10 tablets" />
          </div>
          <div className="flex items-center gap-4 self-end pb-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.prescriptionRequired}
                onChange={(e) => setForm({ ...form, prescriptionRequired: e.target.checked })}
              />
              Prescription required
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isGeneric}
                onChange={(e) => setForm({ ...form, isGeneric: e.target.checked })}
              />
              Generic medicine
            </label>
          </div>

          <details className="sm:col-span-2 rounded-lg border border-border/60 p-3 open:pb-1" open={!isNewProduct}>
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">More details (optional)</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category Group</Label>
                <Select value={form.categoryGroup} onValueChange={(v) => setForm({ ...form, categoryGroup: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>{g.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Medicine Type</Label>
                <Select value={form.medicineType} onValueChange={(v) => setForm({ ...form, medicineType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEDICINE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule Class</Label>
                <Select value={form.scheduleClass} onValueChange={(v) => setForm({ ...form, scheduleClass: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_CLASSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>GST %</Label>
                <Input type="number" value={form.gstPercentage} onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })} />
              </div>
              <div>
                <Label>HSN Code</Label>
                <Input value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Composition (comma separated)</Label>
                <Input
                  value={form.composition}
                  onChange={(e) => setForm({ ...form, composition: e.target.value })}
                  placeholder="Defaults to product name if left blank"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background p-2 text-sm"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Auto-generated if left blank"
                />
              </div>
            </div>
          </details>
        </div>

        {isNewProduct && (
          <div className="mt-4 rounded-lg border border-dashed border-border/60 p-3">
            <p className="mb-2 text-sm font-medium">Initial Stock (optional)</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Add opening stock now so this product is sellable immediately — or leave blank and use{' '}
              <span className="font-medium">Receive Purchase</span> on the Inventory page later.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Branch</Label>
                <Select value={stock.branchId} onValueChange={(v) => setStock({ ...stock, branchId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={stock.quantity} onChange={(e) => setStock({ ...stock, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Batch Number</Label>
                <Input value={stock.batchNumber} onChange={(e) => setStock({ ...stock, batchNumber: e.target.value })} placeholder="INITIAL" />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={stock.expiryDate} onChange={(e) => setStock({ ...stock, expiryDate: e.target.value })} />
              </div>
              <div>
                <Label>Cost Price (₹)</Label>
                <Input type="number" value={stock.costPrice} onChange={(e) => setStock({ ...stock, costPrice: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        <Button
          className="mt-4 w-full"
          onClick={handleSubmit}
          disabled={createMedicine.isPending || updateMedicine.isPending || receivePurchase.isPending}
        >
          {medicine ? 'Update Medicine' : 'Create Product'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
