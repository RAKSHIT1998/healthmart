'use client';

import { useState } from 'react';
import { Plus, Star, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBranches } from '@/hooks/use-catalog';
import { useAllDrivers, useAvailableDrivers, useCreateDriver } from '@/hooks/use-drivers';

export default function DriversPage() {
  const { data: branches } = useBranches();
  const [branchId, setBranchId] = useState('');
  const [view, setView] = useState<'available' | 'all'>('available');
  const { data: availableDrivers, isLoading: loadingAvailable } = useAvailableDrivers(branchId);
  const { data: allDrivers, isLoading: loadingAll } = useAllDrivers(branchId);
  const drivers = view === 'available' ? availableDrivers : allDrivers;
  const isLoading = view === 'available' ? loadingAvailable : loadingAll;
  const createDriver = useCreateDriver();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', vehicleType: 'bike' as const, vehicleNumber: '' });

  function handleSubmit() {
    if (!branchId) return;
    createDriver.mutate(
      { ...form, branchId },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Delivery Drivers</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Register Driver
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-xs">
          <Label>Branch</Label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger><SelectValue placeholder="Select branch to view drivers" /></SelectTrigger>
            <SelectContent>
              {branches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 rounded-lg border border-border/60 p-1">
          <Button size="sm" variant={view === 'available' ? 'default' : 'ghost'} onClick={() => setView('available')}>
            Available Now
          </Button>
          <Button size="sm" variant={view === 'all' ? 'default' : 'ghost'} onClick={() => setView('all')}>
            <Trophy className="h-3.5 w-3.5" /> All Drivers (Performance)
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !branchId ? (
        <p className="text-sm text-muted-foreground">Select a branch to view its drivers.</p>
      ) : drivers && drivers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {view === 'available' ? 'No drivers are currently online for this branch.' : 'No drivers registered for this branch yet.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers?.map((driver, index) => (
            <Card key={driver.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    {view === 'all' && <span className="text-xs text-muted-foreground">#{index + 1}</span>}
                    {typeof driver.userId === 'object' ? driver.userId.name : 'Driver'}
                  </span>
                  <Badge variant={driver.isAvailable ? 'success' : 'secondary'}>{driver.isAvailable ? 'Available' : 'Unavailable'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {typeof driver.userId === 'object' ? driver.userId.phone : ''} · {driver.vehicleType} {driver.vehicleNumber}
                </p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {driver.rating.toFixed(1)}
                  <span className="text-muted-foreground">· {driver.totalDeliveries} deliveries</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Driver</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10} />
            </div>
            <div>
              <Label>Vehicle Type</Label>
              <Select value={form.vehicleType} onValueChange={(v) => setForm({ ...form, vehicleType: v as typeof form.vehicleType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle Number</Label>
              <Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
            </div>
            <Button onClick={handleSubmit} disabled={createDriver.isPending || !branchId}>Register</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
