import { useAuthStore } from '@/store/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// Server-side fetches require an absolute URL. NEXT_PUBLIC_API_URL may be relative (/api/v1)
// which is valid for browsers but not for Node.js fetch. Use the internal loopback instead.
const SERVER_API_URL =
  typeof process !== 'undefined' && process.env.INTERNAL_API_URL
    ? process.env.INTERNAL_API_URL
    : `http://127.0.0.1:${typeof process !== 'undefined' ? (process.env.PORT ?? 5000) : 5000}/api/v1`;

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
    throw new ApiClientError(
      json?.message ?? 'Something went wrong. Please try again.',
      response.status,
      json?.code,
      json?.errors,
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};

/** For server components / generateMetadata — no auth, no client store access. */
export async function publicApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = typeof window === 'undefined' ? SERVER_API_URL : API_BASE_URL;
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = await response.json();
  if (!response.ok || !json?.success) {
    throw new ApiClientError(json?.message ?? 'Failed to fetch', response.status, json?.code);
  }
  return json.data as T;
}
