/** Pure ECL / value-set helpers (safe for client and server bundles). */

/** Build query string without URLSearchParams (avoids `+` for spaces, which Snowstorm rejects). */
export function buildTerminologyQuery(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join('&');
}

/** Implicit SNOMED value set URL (ECL segment encoded; full URL encoded again in queries). */
export function implicitValueSetUrl(ecl: string): string {
  return `http://snomed.info/sct?fhir_vs=ecl/${encodeURIComponent(ecl)}`;
}
