import type { ApiErr, ApiOk } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;
  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  formData?: FormData;
  _retried?: boolean;
}

function buildUrl(path: string, query?: ApiOptions['query']): string {
  const url = new URL(`${API_URL}${path}`, 'http://placeholder');
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    }
  }
  // Strip placeholder if absolute API_URL
  if (API_URL.startsWith('http')) {
    return `${API_URL}${path}${url.search}`;
  }
  return `${path}${url.search}`;
}

async function requestRaw<T>(path: string, opts: ApiOptions = {}): Promise<ApiOk<T>> {
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers,
    body,
    credentials: 'include',
    signal: opts.signal,
  });

  // Try to refresh once on 401 (except auth endpoints themselves)
  if (res.status === 401 && !opts._retried && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return requestRaw<T>(path, { ...opts, _retried: true });
    }
    if (onUnauthorized) onUnauthorized();
  }

  let payload: ApiOk<T> | ApiErr;
  try {
    payload = (await res.json()) as ApiOk<T> | ApiErr;
  } catch {
    throw new ApiError(res.status, `Unexpected response (${res.status})`);
  }

  if (!res.ok || payload.success === false) {
    const err = payload as ApiErr;
    throw new ApiError(res.status, err.message ?? `Request failed (${res.status})`, err.errors);
  }
  return payload as ApiOk<T>;
}

async function request<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const envelope = await requestRaw<T>(path, opts);
  return envelope.data;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const payload = (await res.json()) as ApiOk<{ accessToken: string }> | ApiErr;
      if (payload.success && payload.data.accessToken) {
        accessToken = payload.data.accessToken;
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const api = {
  get: <T>(path: string, opts?: Omit<ApiOptions, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  /** Like `get`, but also returns `meta` (used for paginated lists). */
  getList: async <T>(
    path: string,
    opts?: Omit<ApiOptions, 'method' | 'body' | 'formData'>,
  ): Promise<{ data: T; meta: PageMeta }> => {
    const envelope = await requestRaw<T>(path, { ...opts, method: 'GET' });
    const meta = (envelope.meta ?? {}) as Partial<PageMeta>;
    return {
      data: envelope.data,
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? 20,
        total: meta.total ?? 0,
        totalPages: meta.totalPages ?? 1,
      },
    };
  },
  post: <T>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  del: <T>(path: string, opts?: Omit<ApiOptions, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData, opts?: Omit<ApiOptions, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'POST', formData }),
};
