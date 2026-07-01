import { useAuthStore } from '@/store/admin-auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadFile(file: File | Blob, folder: string): Promise<string> {
  const { accessToken } = useAuthStore.getState();
  const formData = new FormData();
  formData.append('file', file, 'upload.png');

  const response = await fetch(`${API_BASE_URL}/uploads/single?folder=${folder}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message ?? 'Upload failed');
  }

  return (json.data as UploadResult).url;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta?.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
