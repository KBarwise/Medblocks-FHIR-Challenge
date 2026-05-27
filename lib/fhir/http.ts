import { getFhirServerConfig } from './config';

export type FhirHttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: { revalidate?: number };
};

export async function fhirHttp<T>(urlOrPath: string, opts: FhirHttpOptions = {}): Promise<T> {
  const { baseUrl, bearerToken } = getFhirServerConfig();
  if (!baseUrl) {
    throw new Error('FHIR base URL is not configured. Set it in Admin → Clinic settings.');
  }

  const url = urlOrPath.startsWith('http')
    ? urlOrPath
    : `${baseUrl}${urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`}`;

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
    cache: opts.cache ?? 'no-store',
    next: opts.next,
  });

  if (!res.ok) {
    let outcome: unknown = null;
    try {
      outcome = await res.json();
    } catch {
      /* ignore */
    }
    const err = new Error(`FHIR ${res.status} on ${url}`) as Error & { status: number; outcome: unknown };
    err.status = res.status;
    err.outcome = outcome;
    throw err;
  }

  return res.json() as Promise<T>;
}

export function resolveFhirUrl(pathOrUrl: string): string {
  const { baseUrl } = getFhirServerConfig();
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  if (!baseUrl) return pathOrUrl;
  return `${baseUrl}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}
