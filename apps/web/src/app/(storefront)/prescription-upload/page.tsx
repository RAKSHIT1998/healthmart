'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { api, ApiClientError } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface UploadResult {
  url: string;
  publicId: string;
}

export default function PrescriptionUploadPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const uploadAndSubmit = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1'}/uploads/multiple?folder=prescriptions`,
        { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: formData },
      );
      const uploadJson = await uploadResponse.json();
      if (!uploadResponse.ok) throw new ApiClientError(uploadJson.message, uploadResponse.status);

      const imageUrls = (uploadJson.data as UploadResult[]).map((r) => r.url);
      return api.post('/prescriptions', { imageUrls, notes: notes || undefined });
    },
    onSuccess: () => {
      toast.success('Prescription uploaded! Our pharmacist will review it shortly.');
      router.push('/account/prescriptions');
    },
    onError: (err: ApiClientError) => toast.error(err.message),
  });

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const newFiles = Array.from(selected).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  if (!hasHydrated) {
    return null;
  }

  if (!accessToken) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">Please log in to upload a prescription</p>
        <Button onClick={() => router.push('/login')}>Login</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-xl py-10">
      <h1 className="mb-2 text-2xl font-bold">Upload Prescription</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Upload a clear photo of your prescription. Our licensed pharmacist will verify it and match the medicines to
        your order.
      </p>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary"
          >
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload images</p>
            <p className="text-xs text-muted-foreground">JPG/PNG, up to 5 images</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((preview, index) => (
                <div key={preview} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  <Image src={preview} alt="" fill className="object-cover" />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <Label>Notes for pharmacist (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-3 text-sm"
              rows={3}
              placeholder="e.g. for my father, please substitute if unavailable"
            />
          </div>

          <Button
            className="w-full"
            disabled={files.length === 0 || uploadAndSubmit.isPending}
            onClick={() => uploadAndSubmit.mutate()}
          >
            Submit Prescription
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
