/**
 * API client with automatic access-token refresh.
 *
 * The frontend talks to /api/* — which Next rewrites to the backend
 * (see next.config.js). Auth tokens live in localStorage.
 */

const ACCESS_KEY = 'trellox.accessToken';
const REFRESH_KEY = 'trellox.refreshToken';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  raw?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const headers = new Headers(options.headers);
  if (!headers.has('content-type') && options.body && !(options.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }
  const access = getAccessToken();
  if (access) headers.set('authorization', `Bearer ${access}`);

  const init: RequestInit = {
    ...options,
    headers,
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
  };

  let res = await fetch(url.toString().replace(window.location.origin, ''), init);

  if (res.status === 401 && access) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers.set('authorization', `Bearer ${newAccess}`);
      res = await fetch(url.toString().replace(window.location.origin, ''), { ...init, headers });
    }
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const errBody = data as { error?: { code: string; message: string; details?: unknown } } | null;
    throw new ApiError(
      res.status,
      errBody?.error?.code ?? 'UNKNOWN',
      errBody?.error?.message ?? res.statusText,
      errBody?.error?.details,
    );
  }
  return data as T;
}
