import { getClinicalBackendId, getClinicalFhirServerConfig, usesSeparateClinicalStore } from './config';
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
    clinicalFhirUrl: clinical.baseUrl,
  };
}
