import type { AuthUser, TokenResponse } from './types';

/** Empty in dev uses Vite proxy to FastAPI; set VITE_PUBLIC_API_BASE_URL for production. */
export const API_BASE = import.meta.env.VITE_PUBLIC_API_BASE_URL ?? '';

const ACCESS_KEY = 'bitesense_access_token';
const REFRESH_KEY = 'bitesense_refresh_token';

export function getStoredTokens(): { access: string | null; refresh: string | null } {
  return {
    access: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  };
}

export function setStoredTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function readApiError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown };
    const d = j.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      return d
        .map((x: { msg?: string; loc?: unknown }) => x.msg ?? JSON.stringify(x))
        .join(', ');
    }
    return 'Request failed';
  } catch {
    return 'Request failed';
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) {
    clearStoredTokens();
    return false;
  }
  const data = (await res.json()) as TokenResponse;
  setStoredTokens(data.access_token, data.refresh_token);
  return true;
}

export async function tryRefreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export interface ApiRequestOptions extends RequestInit {
  /** Send Authorization bearer (default true). */
  auth?: boolean;
  /** Skip automatic refresh retry on 401. */
  skipRefresh?: boolean;
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { auth = true, skipRefresh = false, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (auth) {
    const access = localStorage.getItem(ACCESS_KEY);
    if (access) headers.set('Authorization', `Bearer ${access}`);
  }
  const url = `${API_BASE}${path}`;
  let res = await fetch(url, { ...rest, headers });

  if (
    res.status === 401 &&
    auth &&
    !skipRefresh &&
    !path.includes('/auth/refresh') &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/register')
  ) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(initHeaders);
      const access = localStorage.getItem(ACCESS_KEY);
      if (access) retryHeaders.set('Authorization', `Bearer ${access}`);
      res = await fetch(url, { ...rest, headers: retryHeaders });
    }
  }
  return res;
}

export async function loginRequest(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as TokenResponse;
}

export async function registerRequest(
  email: string,
  password: string,
  fullName: string
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as TokenResponse;
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiRequest('/api/v1/auth/me', { method: 'GET' });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as AuthUser;
}

export async function logoutRequest(): Promise<void> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return;
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
}
