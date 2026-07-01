'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Prescription } from '@/types';
import Link from 'next/link';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  approved: 'success',
  rejected: 'destructive',
  pending: 'secondary',
  ocr_processed: 'warning',
  under_review: 'warning',
};

export default function PrescriptionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => api.get<Prescription[]>('/prescriptions/mine?page=1&limit=20'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Prescriptions</h1>
        <Button asChild size="sm">
          <Link href="/prescription-upload">Upload New</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t uploaded any prescriptions yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(prescription.createdAt)}</span>
                  <Badge variant={STATUS_VARIANT[prescription.status] ?? 'secondary'}>{prescription.status.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="flex gap-2">
                  {prescription.imageUrls.slice(0, 3).map((url) => (
                    <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                      <Image src={url} alt="Prescription" fill className="object-cover" />
                    </div>
                  ))}
                </div>
                {prescription.rejectionReason && (
                  <p className="mt-2 text-xs text-destructive">{prescription.rejectionReason}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
