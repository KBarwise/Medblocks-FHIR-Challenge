/**
 * Server-side FHIR client. Never import this from client components.
 * Base URL and bearer token come from admin-selected cookies or .env.local.
 */

import { getFhirServerConfig } from './config';

type FhirFetchOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  revalidate?: number | false;
};

export class FhirError extends Error {
  constructor(public status: number, public outcome: unknown, message: string) {
    super(message);
  }
}

async function fhirFetch<T>(path: string, opts: FhirFetchOpts = {}): Promise<T> {
  const { baseUrl, bearerToken } = getFhirServerConfig();
  if (!baseUrl) {
    throw new FhirError(
      0,
      null,
      'FHIR base URL is not configured. Set it in Admin → Clinic settings.',
    );
  }

  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/fhir+json',
    'Content-Type': 'application/fhir+json',
    'Accept-Language': 'en',
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    ...(opts.headers ?? {}),
  };

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: opts.revalidate === false ? 'no-store' : 'default',
    next: typeof opts.revalidate === 'number' ? { revalidate: opts.revalidate } : undefined,
  });

  if (!res.ok) {
    let outcome: unknown = null;
    try { outcome = await res.json(); } catch { /* ignore */ }
    throw new FhirError(res.status, outcome, `FHIR ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

export const fhir = {
  read<T>(resource: string, id: string, revalidate?: number | false) {
    return fhirFetch<T>(`/${resource}/${id}`, { revalidate });
  },
  search<T>(resource: string, params: Record<string, string | number | undefined>) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, String(v));
    }
    return fhirFetch<T>(`/${resource}?${qs.toString()}`, { revalidate: false });
  },
  create<T>(resource: string, body: unknown) {
    return fhirFetch<T>(`/${resource}`, { method: 'POST', body, revalidate: false });
  },
  update<T>(resource: string, id: string, body: unknown) {
    return fhirFetch<T>(`/${resource}/${id}`, { method: 'PUT', body, revalidate: false });
  },
  everything<T>(resource: 'Patient' | 'Encounter', id: string) {
    return fhirFetch<T>(`/${resource}/${id}/$everything`, { revalidate: false });
  },
  raw: fhirFetch,
};
