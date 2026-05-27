import type { Bundle, Patient } from './resources';
import { resolveFhirUrl } from './http';
import { fhirHttp } from './http';

export type ListPatientsResult = {
  patients: Patient[];
  total?: number;
  truncated: boolean;
  error?: string;
};

/**
 * Fetch patients from the FHIR server, following bundle pagination until `max` is reached.
 */
export async function listAllPatients(opts?: { max?: number }): Promise<ListPatientsResult> {
  const max = opts?.max ?? 500;

  try {
    const patients: Patient[] = [];
    let url: string | undefined = resolveFhirUrl('/Patient?_count=100&_sort=family');
    let total: number | undefined;

    while (url && patients.length < max) {
      const bundle: Bundle<Patient> = await fhirHttp<Bundle<Patient>>(url);
      if (bundle.total !== undefined) total = bundle.total;

      for (const entry of bundle.entry ?? []) {
        if (entry.resource?.resourceType === 'Patient' && entry.resource.id) {
          patients.push(entry.resource);
          if (patients.length >= max) break;
        }
      }

      const nextLink = bundle.link?.find((l: { relation: string }) => l.relation === 'next');
      const nextUrl = nextLink?.url;
      url = nextUrl ? resolveFhirUrl(nextUrl) : undefined;
    }

    return {
      patients,
      total,
      truncated: total !== undefined ? patients.length < total : false,
    };
  } catch (e) {
    return {
      patients: [],
      truncated: false,
      error: (e as Error).message,
    };
  }
}
