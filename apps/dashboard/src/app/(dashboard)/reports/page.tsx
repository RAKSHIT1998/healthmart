'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiDownload, ApiClientError } from '@/lib/api';
import { useBranches } from '@/hooks/use-catalog';
import { useExpiryReport, useGstReport, useSalesReport, useStockReport } from '@/hooks/use-reports';
import { toast } from 'sonner';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function DateRangeFilter({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label>From</Label>
        <Input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
      </div>
      <div>
        <Label>To</Label>
        <Input type="date" value={to} onChange={(e) => onTo(e.target.value)} />
      </div>
    </div>
  );
}

function BranchFilter({ branchId, onChange }: { branchId: string; onChange: (v: string) => void }) {
  const { data: branches } = useBranches();
  return (
    <div className="w-56">
      <Label>Branch</Label>
      <Select value={branchId} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="All branches" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All branches</SelectItem>
          {branches?.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

async function downloadCsv(path: string, filename: string) {
  try {
    await apiDownload(path, filename);
  } catch (err) {
    toast.error(err instanceof ApiClientError ? err.message : 'Download failed');
  }
}

function SalesTab() {
  const [from, setFrom] = useState(daysAgoIso(30));
  const [to, setTo] = useState(todayIso());
  const { data, isLoading } = useSalesReport(from, to);
  const total = data?.reduce((sum, r) => sum + r.totalAmount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <Button variant="outline" onClick={() => downloadCsv(`/reports/sales?from=${from}&to=${to}&format=csv`, 'sales-report.csv')}>
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Sales ({data?.length ?? 0} orders)</p>
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Date</th>
                <th className="p-3">Subtotal</th>
                <th className="p-3">Discount</th>
                <th className="p-3">GST</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={8}>Loading...</td></tr>
              ) : data && data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.orderNumber} className="border-b border-border/40">
                    <td className="p-3 font-medium">{row.orderNumber}</td>
                    <td className="p-3">{formatDate(row.date)}</td>
                    <td className="p-3">{formatCurrency(row.subtotal)}</td>
                    <td className="p-3">{formatCurrency(row.discount)}</td>
                    <td className="p-3">{formatCurrency(row.gstAmount)}</td>
                    <td className="p-3 font-medium">{formatCurrency(row.totalAmount)}</td>
                    <td className="p-3 uppercase">{row.paymentMethod}</td>
                    <td className="p-3 capitalize">{row.status}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={8}>No sales in this date range.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function GstTab() {
  const [from, setFrom] = useState(daysAgoIso(30));
  const [to, setTo] = useState(todayIso());
  const { data, isLoading } = useGstReport(from, to);
  const totalGst = data?.reduce((sum, r) => sum + r.totalGstAmount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <Button variant="outline" onClick={() => downloadCsv(`/reports/gst?from=${from}&to=${to}&format=csv`, 'gst-report.csv')}>
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total GST Collected ({data?.length ?? 0} invoices)</p>
          <p className="text-2xl font-bold">{formatCurrency(totalGst)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Invoice</th>
                <th className="p-3">Date</th>
                <th className="p-3">Taxable Amt</th>
                <th className="p-3">CGST</th>
                <th className="p-3">SGST</th>
                <th className="p-3">IGST</th>
                <th className="p-3">Total GST</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={8}>Loading...</td></tr>
              ) : data && data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.invoiceNumber} className="border-b border-border/40">
                    <td className="p-3 font-medium">{row.invoiceNumber}</td>
                    <td className="p-3">{formatDate(row.date)}</td>
                    <td className="p-3">{formatCurrency(row.taxableAmount)}</td>
                    <td className="p-3">{row.isInterState ? '-' : formatCurrency(row.cgstAmount)}</td>
                    <td className="p-3">{row.isInterState ? '-' : formatCurrency(row.sgstAmount)}</td>
                    <td className="p-3">{row.isInterState ? formatCurrency(row.igstAmount) : '-'}</td>
                    <td className="p-3 font-medium">{formatCurrency(row.totalGstAmount)}</td>
                    <td className="p-3">{formatCurrency(row.totalAmount)}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={8}>No invoices in this date range.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StockTab() {
  const [branchId, setBranchId] = useState('all');
  const filterId = branchId === 'all' ? undefined : branchId;
  const { data, isLoading } = useStockReport(filterId);
  const totalValue = data?.reduce((sum, r) => sum + r.stockValue, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <BranchFilter branchId={branchId} onChange={setBranchId} />
        <Button
          variant="outline"
          onClick={() => downloadCsv(`/reports/stock${filterId ? `?branchId=${filterId}&format=csv` : '?format=csv'}`, 'stock-report.csv')}
        >
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Stock Value ({data?.length ?? 0} SKUs)</p>
          <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Medicine</th>
                <th className="p-3">Total Qty</th>
                <th className="p-3">Reserved</th>
                <th className="p-3">Available</th>
                <th className="p-3">Selling Price</th>
                <th className="p-3">Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading...</td></tr>
              ) : data && data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="p-3 font-medium">{row.medicine}</td>
                    <td className="p-3">{row.totalQuantity}</td>
                    <td className="p-3">{row.reservedQuantity}</td>
                    <td className="p-3">{row.availableQuantity}</td>
                    <td className="p-3">{formatCurrency(row.sellingPrice)}</td>
                    <td className="p-3 font-medium">{formatCurrency(row.stockValue)}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={6}>No stock records.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpiryTab() {
  const [branchId, setBranchId] = useState('all');
  const [days, setDays] = useState('90');
  const filterId = branchId === 'all' ? undefined : branchId;
  const { data, isLoading } = useExpiryReport(filterId, Number(days) || undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <BranchFilter branchId={branchId} onChange={setBranchId} />
          <div>
            <Label>Within (days)</Label>
            <Input type="number" className="w-28" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              `/reports/expiry?${filterId ? `branchId=${filterId}&` : ''}days=${days}&format=csv`,
              'expiry-report.csv',
            )
          }
        >
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Medicine</th>
                <th className="p-3">Batch No.</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Qty Remaining</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4 text-muted-foreground" colSpan={4}>Loading...</td></tr>
              ) : data && data.length > 0 ? (
                data.map((row, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="p-3 font-medium">{row.medicine}</td>
                    <td className="p-3">{row.batchNumber}</td>
                    <td className="p-3">{formatDate(row.expiryDate)}</td>
                    <td className="p-3">{row.quantityRemaining}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="p-4 text-muted-foreground" colSpan={4}>No batches expiring in this window.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Sales, GST, stock, and expiry reports — view or export as CSV.</p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
        </TabsList>
        <TabsContent value="sales"><SalesTab /></TabsContent>
        <TabsContent value="gst"><GstTab /></TabsContent>
        <TabsContent value="stock"><StockTab /></TabsContent>
        <TabsContent value="expiry"><ExpiryTab /></TabsContent>
      </Tabs>
    </div>
  );
}
