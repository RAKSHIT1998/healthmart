'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAddresses, useCreateAddress, useDeleteAddress } from '@/hooks/use-addresses';

const LocationPickerMap = dynamic(
  () => import('@/components/location/location-picker-map').then((m) => m.LocationPickerMap),
  { ssr: false },
);

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ contactName: '', contactPhone: '', line1: '', city: '', state: '', pincode: '' });
  const [coords, setCoords] = useState(DEFAULT_CENTER);

  function handleSave() {
    createAddress.mutate(
      { ...form, label: 'home', isDefault: !addresses || addresses.length === 0, lat: coords.lat, lng: coords.lng },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Addresses</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Address
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {addresses?.map((address) => (
            <Card key={address.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {address.contactName}
                      {address.isDefault && <Badge variant="secondary">Default</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{address.contactPhone}</p>
                    <p className="text-xs text-muted-foreground">
                      {address.line1}, {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteAddress.mutate(address.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Address</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} maxLength={10} />
            </div>
            <div>
              <Label>Address Line</Label>
              <Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} maxLength={6} />
            </div>
            <div>
              <Label>Delivery Location</Label>
              <LocationPickerMap lat={coords.lat} lng={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} />
            </div>
            <Button onClick={handleSave} disabled={createAddress.isPending}>
              Save Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
