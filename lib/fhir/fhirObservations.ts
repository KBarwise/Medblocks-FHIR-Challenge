import type { Bundle, Observation } from '@/lib/fhir/resources';

export type LoincFilter = { system: 'http://loinc.org'; code: string }[];

/** Client-safe: must not import server-only config (cookies). */
function fhirProxyBase(): string {
  if (process.env.NEXT_PUBLIC_CLINICAL_API_PREFIX) {
    return process.env.NEXT_PUBLIC_CLINICAL_API_PREFIX;
  }
  return process.env.NEXT_PUBLIC_CLINICAL_BACKEND === 'ehrbase' ? '/api/clinical' : '/api/fhir';
}
const VALID_STATUS = new Set(['final', 'amended', 'corrected', 'preliminary']);

export type FetchObservationsOpts = {
  patientId: string;
  /** Omit when filtering by LOINC only — many servers omit or miscategorize Observation.category. */
  category?: 'vital-signs' | 'laboratory';
  codes?: LoincFilter;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
};

function toProxyUrl(url: string): string {
  const FHIR_PROXY = fhirProxyBase();
  if (url.startsWith(FHIR_PROXY)) return url;
  try {
    const parsed = new URL(url, 'http://local');
    const path = parsed.pathname.startsWith('/Observation')
      ? parsed.pathname
      : parsed.pathname.replace(/^\/fhir\/?/, '/');
    return `${FHIR_PROXY}${path}${parsed.search}`;
  } catch {
    if (url.startsWith('/Observation')) return `${FHIR_PROXY}${url}`;
    return url;
  }
}

function buildSearchUrl(opts: FetchObservationsOpts): string {
  const FHIR_PROXY = fhirProxyBase();
  const params = new URLSearchParams();
  params.set('patient', opts.patientId);
  if (opts.category) params.set('category', opts.category);
  params.set('_sort', '-date');
  params.set('_count', String(opts.pageSize ?? 200));
  if (opts.codes?.length) {
    params.set(
      'code',
      opts.codes.map(c => `${c.system}|${c.code}`).join(','),
    );
  }
  if (opts.dateFrom) params.append('date', `ge${opts.dateFrom}`);
  if (opts.dateTo) params.append('date', `le${opts.dateTo}`);
  return `${FHIR_PROXY}/Observation?${params.toString()}`;
}

async function fetchBundle(url: string): Promise<Bundle<Observation>> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.error === 'string' ? body.error : `FHIR request failed (${res.status})`,
    );
  }
  return res.json() as Promise<Bundle<Observation>>;
}

export async function fetchObservations(opts: FetchObservationsOpts): Promise<Observation[]> {
  let url: string | undefined = buildSearchUrl(opts);
  const all: Observation[] = [];

  while (url) {
    const bundle = await fetchBundle(url);
    for (const entry of bundle.entry ?? []) {
      const resource = entry.resource;
      if (resource?.resourceType === 'Observation' && resource.status !== 'entered-in-error') {
        if (VALID_STATUS.has(resource.status)) all.push(resource);
      }
    }
    const next = bundle.link?.find(l => l.relation === 'next')?.url;
    url = next ? toProxyUrl(next) : undefined;
  }

  return all;
}
