import {
  getClinicalBackendId,
  getClinicalFhirServerConfig,
  getEhrbaseOpenEhrUrl,
  getEhrbaseOpenEhrV1BaseUrl,
  getOpenFhirUrl,
  usesSeparateClinicalStore,
} from './config';
import { resolveFhirServerConfig } from '@/lib/fhir/servers';

/** Read-only summary for Admin settings (server). */
export function getDeploymentBackendSummary() {
  const clinicalBackend = getClinicalBackendId();
  const admin = resolveFhirServerConfig({ presetId: 'env' });
  const clinical = getClinicalFhirServerConfig();

  return {
    clinicalBackend,
    separateClinicalStore: usesSeparateClinicalStore(),
    adminFhirUrl: admin.baseUrl,
    /** FHIR Bridge FHIR R4 base (app → bridge → EHRbase openEHR). */
    clinicalFhirUrl: clinical.baseUrl,
    ehrbaseOpenEhrUrl: getEhrbaseOpenEhrUrl(),
    ehrbaseOpenEhrV1Url: getEhrbaseOpenEhrV1BaseUrl(),
    openFhirUrl: getOpenFhirUrl(),
    usesFhirBridge: clinicalBackend === 'ehrbase',
  };
}

/** Probe configured FHIR Bridge metadata endpoint. */
export async function probeFhirBridgeHealth(): Promise<'up' | 'down' | 'unknown'> {
  const clinical = getClinicalFhirServerConfig();
  if (!clinical.baseUrl) return 'unknown';
  try {
    const url = `${clinical.baseUrl.replace(/\/$/, '')}/metadata`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/fhir+json' },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? 'up' : 'down';
  } catch {
    return 'down';
  }
}

/** Optional health probe for openFHIR (mapping engine). */
export async function probeOpenFhirHealth(): Promise<'up' | 'down' | 'unknown'> {
  try {
    const res = await fetch(`${getOpenFhirUrl()}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return 'down';
    const text = (await res.text()).trim().toUpperCase();
    return text === 'UP' ? 'up' : 'unknown';
  } catch {
    return 'down';
  }
}
