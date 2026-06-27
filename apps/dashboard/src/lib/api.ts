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

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
