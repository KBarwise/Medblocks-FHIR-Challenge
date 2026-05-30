/**
 * Administrative FHIR — Patient, Practitioner, Appointment, Basic, MDM.
 * Uses FHIR_BASE_URL / Admin clinic settings (Codemuse term server in product-line deploy).
 */

import { getFhirServerConfig } from './config';
import { createFhirClient } from './fhir-http';

export const adminFhir = createFhirClient(getFhirServerConfig, 'Admin FHIR');
