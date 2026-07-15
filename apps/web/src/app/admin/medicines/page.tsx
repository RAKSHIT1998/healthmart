'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useAdminMedicines, useDeactivateMedicine } from '@/hooks/admin/use-medicines';
import { MedicineFormDialog } from '@/components/admin/medicines/medicine-form-dialog';
import { BulkUploadDialog } from '@/components/admin/medicines/bulk-upload-dialog';
import { resolveMedicineImage } from '@/lib/medicine-image';
import type { Medicine } from '@/types/admin';

export default function MedicinesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const { data, isLoading } = useAdminMedicines(page, search);
  const deactivate = useDeactivateMedicine();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(medicine: Medicine) {
    setEditing(medicine);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Medicines</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="h-4 w-4" /> Bulk Upload
          </Button>
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">GST</th>
                  <th className="p-3">Rx</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sales</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="p-4 text-muted-foreground" colSpan={8}>Loading...</td></tr>
                ) : (
                  data?.items.map((medicine) => (
                    <tr key={medicine.id} className="border-b border-border/40">
                      <td className="flex items-center gap-3 p-3">
                        <div className="relative h-9 w-9 overflow-hidden rounded-md bg-secondary">
                          <Image src={resolveMedicineImage(medicine)} alt="" fill className="object-contain" />
                        </div>
                        <span className="font-medium">{medicine.name}</span>
                      </td>
                      <td className="p-3">{formatCurrency(medicine.sellingPrice)}</td>
                      <td className="p-3">{medicine.gstPercentage}%</td>
                      <td className="p-3">{medicine.prescriptionRequired ? <Badge variant="warning">Rx</Badge> : '-'}</td>
                      <td className="p-3">
                        <Badge variant={medicine.isGeneric ? 'secondary' : 'outline'}>
                          {medicine.isGeneric ? 'Generic' : 'Branded'}
                        </Badge>
                      </td>
                      <td className="p-3">{medicine.salesCount}</td>
                      <td className="p-3">
                        <Badge variant={medicine.isActive ? 'success' : 'destructive'}>{medicine.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => openEdit(medicine)} className="mr-2 text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => deactivate.mutate(medicine.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border/60 md:hidden">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : (
              data?.items.map((medicine) => (
                <div key={medicine.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                        <Image src={resolveMedicineImage(medicine)} alt="" fill className="object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{medicine.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(medicine.sellingPrice)}</p>
                      </div>
                    </div>
                    <Badge variant={medicine.isActive ? 'success' : 'destructive'}>
                      {medicine.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{medicine.gstPercentage}% GST</Badge>
                    {medicine.prescriptionRequired ? <Badge variant="warning">Prescription</Badge> : <Badge variant="secondary">OTC</Badge>}
                    <Badge variant={medicine.isGeneric ? 'secondary' : 'outline'}>
                      {medicine.isGeneric ? 'Generic' : 'Branded'}
                    </Badge>
                    <Badge variant="secondary">{medicine.salesCount} sales</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(medicine)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deactivate.mutate(medicine.id)}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {data?.meta.pagination && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {data.meta.pagination.page} of {data.meta.pagination.totalPages} ({data.meta.pagination.total} items)
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

      <MedicineFormDialog open={dialogOpen} onOpenChange={setDialogOpen} medicine={editing} />
      <BulkUploadDialog open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  );
}
