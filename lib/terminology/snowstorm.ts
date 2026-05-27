/**
 * Snowstorm terminology client — dual endpoints (configurable via Admin → Clinic settings):
 * - eclBaseUrl: ECL $expand (implicit value sets)
 * - opsBaseUrl: $validate-code, $lookup, and other FHIR terminology ops
 *
 * Server-only: reads cookie/env config via next/headers.
 */

import 'server-only';

import type { Parameters, ValueSet } from '../fhir/resources';
import { getTerminologyConfig } from './config';
import { buildTerminologyQuery, implicitValueSetUrl } from './ecl';

export { implicitValueSetUrl } from './ecl';

type ExpandedConcept = { code: string; system: string; display: string };

const expansionCache = new Map<string, { at: number; data: ExpandedConcept[] }>();
const TTL_MS = 24 * 60 * 60 * 1000;

async function tsFetch<T>(
  base: string,
  path: string,
  authHeader: string,
  init?: RequestInit,
): Promise<T> {
  if (!base) throw new Error('Terminology server URL is not configured');
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: 'application/fhir+json',
      'Accept-Language': 'en',
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Terminology ${res.status} on ${path}`);
  }
  return res.json() as Promise<T>;
}

export function terminologyEndpoints() {
  const { eclBaseUrl, opsBaseUrl } = getTerminologyConfig();
  return {
    ecl: eclBaseUrl || 'not configured',
    ops: opsBaseUrl || 'not configured',
  };
}

/** ECL expansions — uses configured eclBaseUrl. */
export async function expandValueSet(
  urlOrId: string,
  opts: {
    ecl?: string;
    filter?: string;
    count?: number;
  } = {},
): Promise<ExpandedConcept[]> {
  const { eclBaseUrl, authHeader } = getTerminologyConfig();
  const cacheKey = JSON.stringify({ eclBaseUrl, authHeader, urlOrId, ...opts });
  const cached = expansionCache.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  let path: string;
  if (opts.ecl) {
    path = `/ValueSet/$expand?${buildTerminologyQuery({
      url: implicitValueSetUrl(opts.ecl),
      filter: opts.filter,
      count: opts.count !== undefined ? String(opts.count) : undefined,
    })}`;
  } else if (urlOrId.startsWith('http')) {
    path = `/ValueSet/$expand?${buildTerminologyQuery({
      url: urlOrId,
      filter: opts.filter,
      count: opts.count !== undefined ? String(opts.count) : undefined,
    })}`;
  } else {
    path = `/ValueSet/${encodeURIComponent(urlOrId)}/$expand?${buildTerminologyQuery({
      filter: opts.filter,
      count: opts.count !== undefined ? String(opts.count) : undefined,
    })}`;
  }

  const vs = await tsFetch<ValueSet>(eclBaseUrl, path, authHeader);
  const contains = vs.expansion?.contains ?? [];
  const data: ExpandedConcept[] = contains.map(c => ({
    code: c.code ?? '',
    system: c.system ?? 'http://snomed.info/sct',
    display: c.display ?? '',
  }));
  expansionCache.set(cacheKey, { at: Date.now(), data });
  return data;
}

/** ValueSet membership — uses configured opsBaseUrl. */
export async function validateCode(args: {
  system: string;
  code: string;
  display?: string;
  url?: string;
}): Promise<{ result: boolean; message?: string; display?: string }> {
  const { opsBaseUrl, authHeader } = getTerminologyConfig();
  const path = `/ValueSet/$validate-code?${buildTerminologyQuery({
    system: args.system,
    code: args.code,
    display: args.display,
    url: args.url,
  })}`;

  const op = await tsFetch<Parameters>(opsBaseUrl, path, authHeader);
  const get = (n: string) => op.parameter?.find(p => p.name === n);
  return {
    result: get('result')?.valueBoolean ?? false,
    message: get('message')?.valueString,
    display: get('display')?.valueString,
  };
}

export async function lookupConcept(args: {
  system: string;
  code: string;
}): Promise<{ display?: string; designations: Array<{ language?: string; value: string }> }> {
  const { opsBaseUrl, authHeader } = getTerminologyConfig();
  const path = `/CodeSystem/$lookup?${buildTerminologyQuery({
    system: args.system,
    code: args.code,
  })}`;
  const op = await tsFetch<Parameters>(opsBaseUrl, path, authHeader);
  const display = op.parameter?.find(p => p.name === 'display')?.valueString;
  const designations = (op.parameter ?? [])
    .filter(p => p.name === 'designation')
    .map(p => ({ value: p.valueString ?? '' }));
  return { display, designations };
}
