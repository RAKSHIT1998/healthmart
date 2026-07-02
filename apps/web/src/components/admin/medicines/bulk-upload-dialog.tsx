'use client';

import { useRef, useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle2, SkipForward } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBulkUploadMedicines, type BulkUploadResult } from '@/hooks/admin/use-medicines';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATE_HEADERS = ['Name', 'MRP', 'Selling Price', 'GST%', 'Pack Size', 'Manufacturer', 'Category', 'Composition', 'HSN Code', 'Medicine Type', 'Prescription Required'];
const TEMPLATE_EXAMPLE = ['Paracetamol 500mg', '20', '18', '12', '10 tablets', 'GSK', 'General', 'Paracetamol', '3004', 'tablet', 'No'];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE];
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'medicines-bulk-upload-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const upload = useBulkUploadMedicines();

  function handleFile(file: File | undefined) {
    if (!file) return;
    setResult(null);
    upload.mutate(file, {
      onSuccess: (data) => setResult(data),
    });
  }

  function handleClose(v: boolean) {
    if (!upload.isPending) {
      setResult(null);
      onOpenChange(v);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Medicines</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Upload a CSV or Excel file with one medicine per row. Medicines already in the system (same name) are skipped — not duplicated.
        </p>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download Template
          </Button>
          <span className="text-xs text-muted-foreground">Start from the template to get the column format right.</span>
        </div>

        <div className="rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Required columns:</p>
          <p><span className="font-mono bg-muted px-1 rounded">Name</span>, <span className="font-mono bg-muted px-1 rounded">MRP</span>, <span className="font-mono bg-muted px-1 rounded">Selling Price</span></p>
          <p className="mt-1 font-medium">Optional:</p>
          <p>GST%, Pack Size, Manufacturer, Category, Composition, HSN Code, Medicine Type, Prescription Required</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <Button
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          {upload.isPending ? (
            <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Processing…</span>
          ) : (
            <><Upload className="h-4 w-4" /> Choose File &amp; Upload</>
          )}
        </Button>

        {result && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" /> {result.processed} created
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <SkipForward className="h-4 w-4" /> {result.skipped} skipped
              </span>
              {result.failed > 0 && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="h-4 w-4" /> {result.failed} failed
                </span>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                <p className="text-xs font-medium text-destructive">Errors:</p>
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <span className="font-mono text-destructive">Row {e.row}</span> — <span className="font-medium">{e.name}</span>: {e.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
