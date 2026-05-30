/** Product branding — override via env for separate Vercel product lines. */

export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? 'Sentinel';
export const PRODUCT_VENDOR = process.env.NEXT_PUBLIC_PRODUCT_VENDOR ?? 'Codemuse';
export const PRODUCT_FULL_NAME = `${PRODUCT_NAME} by ${PRODUCT_VENDOR}`;

export const PRODUCT_DESCRIPTION =
  process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION
  ?? 'Clinical workflow and incretin therapy surveillance — admin data on FHIR, clinical chart on EHRbase.';

/** Default when no clinic display name has been configured. */
export const DEFAULT_CLINIC_NAME = process.env.NEXT_PUBLIC_DEFAULT_CLINIC_NAME ?? 'Demo Clinic';

/** Browser tab and metadata: clinic first, product second. */
export function documentTitle(clinicName: string): string {
  const clinic = clinicName.trim() || DEFAULT_CLINIC_NAME;
  return `${clinic} · ${PRODUCT_NAME}`;
}
