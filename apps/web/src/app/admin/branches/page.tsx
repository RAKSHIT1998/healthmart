'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Building2, Plus, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminBranches, useCreateBranch, useDeactivateBranch, useUpdateBranch, type BranchInput } from '@/hooks/admin/use-catalog';
import type { Branch } from '@/types/admin';

const LocationPickerMap = dynamic(
  () => import('@/components/location/location-picker-map').then((m) => m.LocationPickerMap),
  { ssr: false },
);

const EMPTY_FORM: BranchInput = {
  name: '',
  code: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  lat: 0,
  lng: 0,
  gstin: '',
  isMainBranch: false,
};

export default function BranchesPage() {
  const { data: branches, isLoading } = useAdminBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deactivateBranch = useDeactivateBranch();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchInput>(EMPTY_FORM);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setForm({
      name: branch.name,
      code: branch.code,
      phone: branch.phone ?? '',
      address: branch.address,
      city: branch.city,
      state: branch.state,
      pincode: branch.pincode,
      lat: branch.lat,
      lng: branch.lng,
      gstin: branch.gstin ?? '',
      isMainBranch: branch.isMainBranch,
    });
    setOpen(true);
  }

  function handleSubmit() {
    if (editing) {
      updateBranch.mutate({ id: editing.id, input: form }, { onSuccess: () => setOpen(false) });
    } else {
      createBranch.mutate(form, { onSuccess: () => setOpen(false) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Branches</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches?.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4 text-primary" /> {branch.name}
                  </span>
                  {branch.isMainBranch && (
                    <Badge variant="success">
                      <Star className="mr-1 h-3 w-3 fill-current" /> Main
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs font-mono text-muted-foreground">{branch.code}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {branch.address}, {branch.city}, {branch.state} - {branch.pincode}
                </p>
                {branch.gstin && <p className="mt-1 text-xs text-muted-foreground">GSTIN: {branch.gstin}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={branch.isActive ? 'success' : 'destructive'}>{branch.isActive ? 'Active' : 'Inactive'}</Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(branch)}>
                      Edit
                    </Button>
                    {branch.isActive && !branch.isMainBranch && (
                      <Button size="sm" variant="destructive" onClick={() => deactivateBranch.mutate(branch.id)}>
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.code} disabled={!!editing} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} maxLength={6} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10} />
            </div>
            <div>
              <Label>GSTIN</Label>
              <Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} />
            </div>
            <div className="sm:col-span-2">
              <Label>
                Branch Location{' '}
                {form.lat && form.lng ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    ({form.lat.toFixed(5)}, {form.lng.toFixed(5)})
                  </span>
                ) : (
                  <span className="text-xs text-destructive">not set</span>
                )}
              </Label>
              <LocationPickerMap lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isMainBranch}
                onChange={(e) => setForm({ ...form, isMainBranch: e.target.checked })}
              />
              Set as main branch (orders default here unless multi-branch routing is configured)
            </label>
            <Button className="sm:col-span-2" onClick={handleSubmit} disabled={createBranch.isPending || updateBranch.isPending}>
              {editing ? 'Save Changes' : 'Create Branch'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
