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
 * FHIR API base for clinical resources on EHRbase.
 * Default path matches standard EHRbase FHIR R4 deployment; override if your install differs.
 */
export function getClinicalFhirServerConfig(): FhirServerConfig {
  if (getClinicalBackendId() === 'fhir') {
    return getFhirServerConfig();
  }

  const baseUrl = normalizeFhirBaseUrl(
    process.env.EHRBASE_FHIR_URL
      ?? process.env.EHRBASE_BASE_URL
      ?? 'https://ehrbase.codemuseai.com/ehrbase/rest/fhir/R4',
  );

  return {
    presetId: 'env',
    label: `EHRbase clinical · ${baseUrl}`,
    baseUrl,
    bearerToken: process.env.EHRBASE_BEARER_TOKEN ?? '',
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
