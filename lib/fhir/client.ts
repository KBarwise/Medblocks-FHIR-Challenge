/**
 * Server-side FHIR clients. Never import from client components.
 *
 * - `adminFhir` — demographics, scheduling, kiosk queues, clinic settings
 * - `clinicalFhir` — chart data (EHRbase in Codemuse product-line deploy)
 * - `fhir` — alias for adminFhir (legacy imports)
 */

export { FhirError, type FhirClient } from './fhir-http';
export { adminFhir } from './admin-client';
export { clinicalFhir } from './clinical-client';

import { adminFhir } from './admin-client';

/** @deprecated Prefer adminFhir or clinicalFhir explicitly. */
export const fhir = adminFhir;
