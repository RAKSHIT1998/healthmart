'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Link2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  max?: number;
}

/** Drag-drop / click-to-browse multi-image uploader — uploads directly to Cloudinary via the
 * existing /uploads/single endpoint, so admins never need to find or host an image URL by hand. */
export function ImageUpload({ images, onChange, folder = 'medicines', max = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addUrl() {
    const url = urlValue.trim();
    if (!url) return;
    onChange([...images, url]);
    setUrlValue('');
    setShowUrlField(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - images.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded = await Promise.all(toUpload.map((file) => uploadFile(file, folder)));
      onChange([...images, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {images.map((src, index) => (
          <div key={src} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border/60 bg-secondary">
            <Image src={src} alt="" fill className="object-contain" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            disabled={uploading}
            className={cn(
              'flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary',
              dragOver && 'border-primary bg-primary/5 text-primary',
            )}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading' : 'Add image'}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {images.length < max &&
        (showUrlField ? (
          <div className="flex gap-2">
            <Input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              placeholder="https://..."
              className="h-8 text-xs"
              autoFocus
            />
            <button type="button" onClick={addUrl} className="text-xs font-medium text-primary hover:underline">
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowUrlField(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <Link2 className="h-3 w-3" /> or paste an image URL instead
          </button>
        ))}
    </div>
  );
}
