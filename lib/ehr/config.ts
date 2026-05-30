import { getFhirServerConfig } from '@/lib/fhir/config';
import { normalizeFhirBaseUrl, type FhirServerConfig } from '@/lib/fhir/servers';

export type ClinicalBackendId = 'fhir' | 'ehrbase';

/** How clinical chart data is stored (Observation, Condition, MedicationRequest, …). */
export function getClinicalBackendId(): ClinicalBackendId {
  const raw = process.env.CLINICAL_BACKEND?.trim().toLowerCase();
  if (raw === 'fhir') return 'fhir';
  return 'ehrbase';
}

export function usesSeparateClinicalStore(): boolean {
  return getClinicalBackendId() === 'ehrbase';
}

/**
 * EHRbase openEHR REST API (Swagger at `/swagger-ui`, AQL at `/rest/openehr/v1/query/aql`).
 * The Next.js app does not call this directly when using FHIR Bridge — operators point the bridge here.
 */
export function getEhrbaseOpenEhrUrl(): string {
  const raw =
    process.env.EHRBASE_OPENEHR_URL?.trim()
    ?? process.env.EHRBASE_BASE_URL?.trim()
    ?? 'https://ehrbase.codemuseai.com/ehrbase';
  return raw.replace(/\/$/, '');
}

/** openEHR v1 API base (trailing slash), for FHIR Bridge `FHIR_BRIDGE_EHRBASE_BASE_URL`. */
export function getEhrbaseOpenEhrV1BaseUrl(): string {
  const base = getEhrbaseOpenEhrUrl();
  if (base.endsWith('/rest/openehr/v1')) return `${base}/`;
  if (base.endsWith('/rest/openehr/v1/')) return base;
  return `${base}/rest/openehr/v1/`;
}

/**
 * openFHIR mapping engine (FHIR ↔ openEHR). Swagger at `/swagger-ui`.
 * Not a FHIR R4 REST server — the app does not call this for Observation CRUD.
 * Used by operators for template/mapper configuration alongside EHRbase.
 */
export function getOpenFhirUrl(): string {
  const raw = process.env.OPENFHIR_URL?.trim() ?? 'https://openfhir.codemuseai.com';
  return raw.replace(/\/$/, '');
}

/**
 * FHIR R4 base URL for clinical resources.
 * With `CLINICAL_BACKEND=ehrbase` this must be a running
 * [NUM FHIR Bridge](https://github.com/NUM-Forschungsdatenplattform/num-fhir-bridge) — not EHRbase’s openEHR Swagger API.
 *
 * Default local dev matches fhir-bridge `server.servlet.context-path` + HAPI servlet (`/fhir`).
 */
export function getClinicalFhirServerConfig(): FhirServerConfig {
  if (getClinicalBackendId() === 'fhir') {
    return getFhirServerConfig();
  }

  const baseUrl = normalizeFhirBaseUrl(
    process.env.FHIR_BRIDGE_URL
      ?? process.env.EHRBASE_FHIR_URL
      ?? 'http://localhost:8888/fhir-bridge/fhir',
  );

  return {
    presetId: 'env',
    label: `FHIR Bridge (EHRbase) · ${baseUrl}`,
    baseUrl,
    bearerToken: process.env.FHIR_BRIDGE_BEARER_TOKEN ?? process.env.EHRBASE_BEARER_TOKEN ?? '',
  };
}

/** Browser: which API prefix loads Observation trends. */
export function clinicalObservationApiPrefix(): string {
  const pub = process.env.NEXT_PUBLIC_CLINICAL_BACKEND?.trim().toLowerCase();
  if (pub === 'ehrbase' || (pub !== 'fhir' && usesSeparateClinicalStore())) {
    return '/api/clinical';
  }
  return '/api/fhir';
}
