'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { useBranches } from '@/hooks/admin/use-catalog';
import {
  useBulkUpdatePreview,
  useCommitBulkUpdate,
  type BulkUpdateFieldSet,
  type BulkUpdatePreviewRow,
  type CommitBulkUpdateRow,
} from '@/hooks/admin/use-bulk-update';

const FIELD_LABELS: Record<keyof BulkUpdateFieldSet, string> = {
  name: 'Name',
  mrp: 'MRP',
  sellingPrice: 'Selling Price',
  gstPercentage: 'GST %',
  hsnCode: 'HSN',
  packSize: 'Pack Size',
  isActive: 'Active',
  stockQuantity: 'Stock',
};

function formatFieldValue(field: keyof BulkUpdateFieldSet, value: unknown): string {
  if (value === undefined) return '—';
  if (field === 'mrp' || field === 'sellingPrice') return formatCurrency(Number(value));
  if (field === 'isActive') return value ? 'Yes' : 'No';
  return String(value);
}

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkUpdateDialog({ open, onOpenChange }: BulkUpdateDialogProps) {
  const { data: branches } = useBranches();
  const preview = useBulkUpdatePreview();
  const commit = useCommitBulkUpdate();

  const [branchId, setBranchId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<BulkUpdatePreviewRow[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function reset() {
    setBranchId('');
    setFile(null);
    setRows(null);
    setSelected(new Set());
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handlePreview() {
    if (!file || !branchId) return;
    preview.mutate(
      { file, branchId },
      {
        onSuccess: (result) => {
          setRows(result);
          setSelected(
            new Set(result.filter((r) => r.matchStatus === 'matched' && r.errors.length === 0).map((r) => r.rowIndex)),
          );
        },
      },
    );
  }

  function toggleRow(rowIndex: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  }

  const validRows = rows?.filter((r) => r.matchStatus === 'matched' && r.errors.length === 0) ?? [];

  function handleCommit() {
    if (!rows || selected.size === 0) return;
    const selectedRows: CommitBulkUpdateRow[] = rows
      .filter((r) => selected.has(r.rowIndex) && r.matchedMedicineId)
      .map((r) => ({ medicineId: r.matchedMedicineId!, ...r.proposed }));

    commit.mutate(
      { branchId, rows: selectedRows },
      { onSuccess: () => handleOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={rows ? 'max-w-3xl' : 'max-w-lg'}>
        <DialogHeader>
          <DialogTitle>Bulk Update Stock & Pricing</DialogTitle>
        </DialogHeader>

        {!rows ? (
          <div className="grid gap-3">
            <div>
              <Label>Branch (for stock quantity)</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File</Label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Match rows by SKU/item code or exact product name. Columns recognized: Name, MRP, Selling Price, Stock
              Quantity, GST%, HSN, Pack Size, Active. PDFs must contain selectable text (not a scanned image).
            </p>
            <Button onClick={handlePreview} disabled={!file || !branchId || preview.isPending}>
              {preview.isPending ? 'Parsing...' : 'Preview Changes'}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>
                {validRows.length} valid, {rows.length - validRows.length} with errors — {selected.size} selected
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setSelected(new Set(validRows.map((r) => r.rowIndex)))}
                >
                  Select all valid
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:underline"
                  onClick={() => setSelected(new Set())}
                >
                  Deselect all
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-border/60 bg-card text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="w-8 p-2"></th>
                    <th className="p-2">Row</th>
                    <th className="p-2">Product</th>
                    <th className="p-2">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const hasError = row.errors.length > 0;
                    return (
                      <tr key={row.rowIndex} className="border-b border-border/40 align-top">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selected.has(row.rowIndex)}
                            disabled={hasError}
                            onChange={() => toggleRow(row.rowIndex)}
                          />
                        </td>
                        <td className="p-2">
                          <div className="font-medium">{row.identifier || `#${row.rowIndex + 1}`}</div>
                          {row.matchedMedicineName && (
                            <div className="text-xs text-muted-foreground">{row.matchedMedicineName}</div>
                          )}
                          {row.matchStatus === 'not_found' && (
                            <Badge variant="destructive" className="mt-1 text-[10px]">No match</Badge>
                          )}
                          {row.matchStatus === 'ambiguous' && (
                            <Badge variant="warning" className="mt-1 text-[10px]">Ambiguous</Badge>
                          )}
                        </td>
                        <td className="p-2">
                          {row.changedFields.length > 0 && (
                            <ul className="space-y-0.5">
                              {row.changedFields.map((field) => {
                                const key = field as keyof BulkUpdateFieldSet;
                                return (
                                  <li key={field}>
                                    <span className="text-muted-foreground">{FIELD_LABELS[key]}:</span>{' '}
                                    {formatFieldValue(key, row.current[key])} →{' '}
                                    <span className="font-medium">{formatFieldValue(key, row.proposed[key])}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {hasError && (
                            <ul className="mt-1 space-y-0.5 text-xs text-destructive">
                              {row.errors.map((err) => (
                                <li key={err}>{err}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRows(null)}>
                Choose Different File
              </Button>
              <Button className="flex-1" onClick={handleCommit} disabled={selected.size === 0 || commit.isPending}>
                {commit.isPending ? 'Applying...' : `Apply ${selected.size} Change${selected.size === 1 ? '' : 's'}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
