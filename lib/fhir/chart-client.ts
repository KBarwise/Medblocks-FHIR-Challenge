/**
 * FHIR client for clinical chart writes (Observations, Conditions, …).
 * Full FHIR deploy: same server as admin. EHRbase product line: FHIR Bridge.
 */

import { fhir } from './client';

/** Single-server / Lucea / HAPI — all resources on FHIR_BASE_URL. */
export const chartFhir = fhir;
