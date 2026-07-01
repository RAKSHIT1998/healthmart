'use client';

import { useState } from 'react';
import { Building2, MapPinOff, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBranches } from '@/hooks/admin/use-catalog';
import {
  useBulkCreateServiceablePincodes,
  useCreateServiceablePincode,
  useDeleteServiceablePincode,
  useLookupCityPincodes,
  useServiceablePincodes,
  useUpdateServiceablePincode,
  type CityPincodeResult,
} from '@/hooks/admin/use-serviceability';

export default function ServiceAreasPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useServiceablePincodes(page);
  const { data: branches } = useBranches();
  const createPincode = useCreateServiceablePincode();
  const updatePincode = useUpdateServiceablePincode();
  const deletePincode = useDeleteServiceablePincode();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ pincode: '', branchId: '', estimatedDeliveryMinutes: '60' });

  function openCreate() {
    setForm({ pincode: '', branchId: branches?.length === 1 ? branches[0]!.id : '', estimatedDeliveryMinutes: '60' });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.pincode || !form.branchId) return;
    createPincode.mutate(
      {
        pincode: form.pincode,
        branchId: form.branchId,
        estimatedDeliveryMinutes: Number(form.estimatedDeliveryMinutes),
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  // "Add by City" — look up every pincode for a city via India Post, let the admin review/deselect,
  // then bulk-add the selected ones in one go instead of typing each pincode by hand.
  const lookupCity = useLookupCityPincodes();
  const bulkCreate = useBulkCreateServiceablePincodes();
  const [cityOpen, setCityOpen] = useState(false);
  const [cityForm, setCityForm] = useState({ city: '', branchId: '', estimatedDeliveryMinutes: '60' });
  const [cityResults, setCityResults] = useState<CityPincodeResult[] | null>(null);
  const [selectedPincodes, setSelectedPincodes] = useState<Set<string>>(new Set());

  function openCityDialog() {
    setCityForm({ city: '', branchId: branches?.length === 1 ? branches[0]!.id : '', estimatedDeliveryMinutes: '60' });
    setCityResults(null);
    setSelectedPincodes(new Set());
    setCityOpen(true);
  }

  function handleCitySearch() {
    if (!cityForm.city.trim()) return;
    lookupCity.mutate(cityForm.city, {
      onSuccess: (results) => {
        setCityResults(results);
        setSelectedPincodes(new Set(results.filter((r) => r.districtMatch).map((r) => r.pincode)));
      },
    });
  }

  function togglePincode(pincode: string) {
    setSelectedPincodes((prev) => {
      const next = new Set(prev);
      if (next.has(pincode)) next.delete(pincode);
      else next.add(pincode);
      return next;
    });
  }

  function handleBulkAdd() {
    if (!cityForm.branchId || selectedPincodes.size === 0) return;
    bulkCreate.mutate(
      {
        pincodes: Array.from(selectedPincodes),
        branchId: cityForm.branchId,
        estimatedDeliveryMinutes: Number(cityForm.estimatedDeliveryMinutes),
      },
      { onSuccess: () => setCityOpen(false) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Areas</h1>
          <p className="text-sm text-muted-foreground">
            Pincodes you currently deliver to, and the delivery time estimate customers see for each.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openCityDialog}>
            <Building2 className="h-4 w-4" /> Add by City
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Pincode
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Pincode</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Est. Delivery</th>
                <th className="p-3">Active</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading...</td></tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((entry) => {
                  const branch = typeof entry.branchId === 'object' ? entry.branchId : null;
                  return (
                    <tr key={entry.id} className="border-b border-border/40">
                      <td className="p-3 font-medium">{entry.pincode}</td>
                      <td className="p-3">{branch?.name ?? String(entry.branchId)}</td>
                      <td className="p-3">
                        <Badge variant="secondary">
                          {entry.estimatedDeliveryMinutes < 60
                            ? `${entry.estimatedDeliveryMinutes} mins`
                            : `${(entry.estimatedDeliveryMinutes / 60).toFixed(1)} hrs`}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Switch
                          checked={entry.isActive}
                          onCheckedChange={(v) => updatePincode.mutate({ id: entry.id, isActive: v })}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deletePincode.mutate(entry.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-8 text-center text-muted-foreground" colSpan={5}>
                    <MapPinOff className="mx-auto mb-2 h-6 w-6" />
                    No pincodes added yet — customers outside this list will see &quot;not deliverable yet&quot; at checkout.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {data?.meta.pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.meta.pagination.page} of {data.meta.pagination.totalPages} ({data.meta.pagination.total} pincodes)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!data.meta.pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!data.meta.pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Serviceable Pincode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Pincode</Label>
              <Input
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                maxLength={6}
                placeholder="560001"
              />
            </div>
            <div>
              <Label>Branch that delivers here</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estimated Delivery Time (minutes)</Label>
              <Input
                type="number"
                value={form.estimatedDeliveryMinutes}
                onChange={(e) => setForm({ ...form, estimatedDeliveryMinutes: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">Shown to customers as "Delivering in ~X mins" before checkout.</p>
            </div>
            <Button onClick={handleSubmit} disabled={createPincode.isPending}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cityOpen} onOpenChange={setCityOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Pincodes by City</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>City</Label>
                <Input
                  value={cityForm.city}
                  onChange={(e) => setCityForm({ ...cityForm, city: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCitySearch())}
                  placeholder="Jammu"
                />
              </div>
              <Button className="self-end" onClick={handleCitySearch} disabled={lookupCity.isPending}>
                Search
              </Button>
            </div>

            {cityResults && (
              <>
                <div>
                  <Label>Branch that delivers here</Label>
                  <Select value={cityForm.branchId} onValueChange={(v) => setCityForm({ ...cityForm, branchId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Delivery Time (minutes)</Label>
                  <Input
                    type="number"
                    value={cityForm.estimatedDeliveryMinutes}
                    onChange={(e) => setCityForm({ ...cityForm, estimatedDeliveryMinutes: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Applied to every pincode you select below.</p>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label>
                      Found {cityResults.length} pincode(s) — {selectedPincodes.size} selected
                    </Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() =>
                        setSelectedPincodes(
                          selectedPincodes.size === cityResults.length ? new Set() : new Set(cityResults.map((r) => r.pincode)),
                        )
                      }
                    >
                      {selectedPincodes.size === cityResults.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border/60 p-2">
                    {cityResults.map((result) => (
                      <label
                        key={result.pincode}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPincodes.has(result.pincode)}
                          onChange={() => togglePincode(result.pincode)}
                        />
                        <span className="font-medium">{result.pincode}</span>
                        <span className="flex-1 truncate text-muted-foreground">{result.area}</span>
                        {!result.districtMatch && (
                          <Badge variant="warning" className="shrink-0 text-[10px]">
                            {result.district}, {result.state}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pincodes flagged with a district/state badge didn&apos;t match &quot;{cityForm.city}&quot; as a district —
                    double-check those before including them.
                  </p>
                </div>

                <Button
                  onClick={handleBulkAdd}
                  disabled={bulkCreate.isPending || !cityForm.branchId || selectedPincodes.size === 0}
                >
                  Add {selectedPincodes.size} Pincode{selectedPincodes.size === 1 ? '' : 's'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
