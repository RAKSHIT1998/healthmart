'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { usePendingPrescriptions, useReviewPrescription } from '@/hooks/admin/use-prescriptions';

export default function PrescriptionsPage() {
  const [page] = useState(1);
  const { data, isLoading } = usePendingPrescriptions(page);
  const review = useReviewPrescription();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Prescription Review Queue</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No prescriptions pending review. 🎉</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {typeof prescription.userId === 'object' ? prescription.userId.name : 'Customer'}
                  </span>
                  <Badge variant="warning">{prescription.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{formatDateTime(prescription.createdAt)}</p>
                <div className="mb-3 flex gap-2 overflow-x-auto">
                  {prescription.imageUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border">
                      <Image src={url} alt="Prescription" fill className="object-cover" />
                    </a>
                  ))}
                </div>
                {prescription.ocrMatchedTerms.length > 0 && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    OCR detected: {prescription.ocrMatchedTerms.slice(0, 10).join(', ')}
                  </p>
                )}
                {prescription.notes && <p className="mb-3 text-xs italic text-muted-foreground">&ldquo;{prescription.notes}&rdquo;</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => review.mutate({ id: prescription.id, status: 'approved' })} disabled={review.isPending}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => review.mutate({ id: prescription.id, status: 'rejected', rejectionReason: 'Unclear or invalid prescription' })}
                    disabled={review.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
