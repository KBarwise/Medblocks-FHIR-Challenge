import {
  getClinicalBackendId,
  getClinicalFhirServerConfig,
  getEhrbaseOpenEhrUrl,
  getEhrbaseOpenEhrV1BaseUrl,
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
    usesFhirBridge: clinicalBackend === 'ehrbase',
  };
}
