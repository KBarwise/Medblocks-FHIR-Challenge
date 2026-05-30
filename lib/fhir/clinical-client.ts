/**
 * Clinical FHIR — Observation, Condition, MedicationRequest, Encounter, ServiceRequest.
 * Uses EHRbase FHIR API when CLINICAL_BACKEND=ehrbase, else the same server as admin.
 */

import { getClinicalFhirServerConfig } from '@/lib/ehr/config';
import { createFhirClient } from './fhir-http';

export const clinicalFhir = createFhirClient(getClinicalFhirServerConfig, 'Clinical store');
