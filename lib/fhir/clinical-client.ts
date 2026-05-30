/**
 * Clinical FHIR — Observation, Condition, MedicationRequest, Encounter, ServiceRequest.
 * When CLINICAL_BACKEND=ehrbase, targets FHIR Bridge (FHIR R4 → EHRbase openEHR), not the
 * EHRbase Swagger/openEHR API. See docs/DEPLOY-CODEMUSE-EHRBASE.md.
 */

import { getClinicalFhirServerConfig } from '@/lib/ehr/config';
import { createFhirClient } from './fhir-http';

export const clinicalFhir = createFhirClient(getClinicalFhirServerConfig, 'Clinical store');
