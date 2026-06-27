import { useAuthStore } from '@/store/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  skipRetry?: boolean;
}

async function refreshTokens(): Promise<boolean> {
  const { refreshToken, setTokens, clearSession } = useAuthStore.getState();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearSession();
    return false;
  }

  const json = await response.json();
  setTokens(json.data.accessToken, json.data.refreshToken);
  return true;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, skipRetry, headers, ...rest } = options;
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && auth && !skipRetry) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipRetry: true });
    }
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.success) {
    throw new ApiClientError(json?.message ?? 'Something went wrong. Please try again.', response.status, json?.code, json?.errors);
  }

  return json.data as T;
}

export interface ApiListResult<T> {
  items: T[];
  meta: { pagination?: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } };
}

export async function apiFetchWithMeta<T>(path: string, options: RequestOptions = {}): Promise<ApiListResult<T>> {
  const { body, auth = true, headers, ...rest } = options;
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();
  if (!response.ok || !json?.success) {
    throw new ApiClientError(json?.message ?? 'Something went wrong.', response.status, json?.code);
  }

  return { items: json.data, meta: json.meta ?? {} };
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new ApiClientError(json?.message ?? 'Upload failed. Please try again.', response.status, json?.code, json?.errors);
  }

  return json.data as T;
}

/** Fetches a CSV (or other file) response and triggers a browser download — used by the Reports page's "Download CSV" buttons. */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new ApiClientError(json?.message ?? 'Download failed. Please try again.', response.status, json?.code);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
