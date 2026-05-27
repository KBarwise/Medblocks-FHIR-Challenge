import { fhir } from './client';
import { dedupePatientRecords } from './patient-dedupe';
import type { Bundle, Patient } from './resources';
import { fullName } from '@/lib/utils';

function extractPatients(bundle: Bundle<Patient>): Patient[] {
  return (bundle.entry ?? [])
    .map(e => e.resource)
    .filter((r): r is Patient => r?.resourceType === 'Patient' && Boolean(r.id));
}

function tokenize(query: string): string[] {
  return query.trim().split(/\s+/).filter(t => t.length >= 2);
}

function matchesAllTokens(patient: Patient, tokens: string[]): boolean {
  const hay = fullName(patient).toLowerCase();
  return tokens.every(t => hay.includes(t.toLowerCase()));
}

/** MRN values are alphanumeric on this server (e.g. DFMYYKU), not digits-only. */
function looksLikeMrn(query: string): boolean {
  const q = query.trim();
  if (q.includes(' ') || q.length < 4) return false;
  return /^[A-Za-z0-9-]+$/.test(q);
}

async function searchWithParams(params: Record<string, string | number>): Promise<Patient[]> {
  const bundle = await fhir.search<Bundle<Patient>>('Patient', params);
  return extractPatients(bundle);
}

/**
 * Search patients by MRN, single name token, or "given … family" (last word = family).
 * HAPI does not match multi-word `name` values like "Patricia Martinez"; use given+family.
 */
export async function searchPatients(query: string, count = 25): Promise<Patient[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  if (looksLikeMrn(q)) {
    const byIdentifier = await searchWithParams({ identifier: q, _count: count });
    if (byIdentifier.length > 0) return finalizeSearchResults(byIdentifier, count);
  }

  const tokens = tokenize(q);

  if (tokens.length >= 2) {
    const family = tokens[tokens.length - 1];
    const given = tokens.slice(0, -1).join(' ');

    const byGivenFamily = await searchWithParams({
      given,
      family,
      _count: count,
    });
    if (byGivenFamily.length > 0) return finalizeSearchResults(byGivenFamily, count);

    // Fallback: family search + match all tokens in display name (handles server quirks)
    const byFamily = await searchWithParams({
      family,
      _count: Math.max(count, 50),
    });
    const filtered = byFamily.filter(p => matchesAllTokens(p, tokens));
    if (filtered.length > 0) return finalizeSearchResults(filtered, count);
  }

  const rows = await searchWithParams({ name: q, _count: count });
  return finalizeSearchResults(rows, count);
}

function finalizeSearchResults(patients: Patient[], count: number): Patient[] {
  return dedupePatientRecords(patients).slice(0, count);
}

function normalizeNamePart(value: string): string {
  return value.trim().toLowerCase();
}

function patientGiven(patient: Patient): string {
  return patient.name?.[0]?.given?.[0] ?? '';
}

function patientFamily(patient: Patient): string {
  return patient.name?.[0]?.family ?? '';
}

/** Match an existing patient by legal name and date of birth (YYYY-MM-DD). */
export async function findPatientByNameAndDob(
  given: string,
  family: string,
  birthDate: string,
): Promise<Patient | null> {
  const g = given.trim();
  const f = family.trim();
  const dob = birthDate.trim();
  if (!g || !f || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;

  const rows = await searchWithParams({
    family: f,
    birthdate: dob,
    _count: 25,
  });

  const matches = dedupePatientRecords(rows).filter(p => {
    if (p.birthDate !== dob) return false;
    return (
      normalizeNamePart(patientGiven(p)) === normalizeNamePart(g)
      && normalizeNamePart(patientFamily(p)) === normalizeNamePart(f)
    );
  });

  if (matches.length === 1) return matches[0];
  if (matches.length === 0) {
    const byName = await searchPatients(`${g} ${f}`, 25);
    const fallback = byName.filter(p => p.birthDate === dob);
    if (fallback.length === 1) return fallback[0];
    return null;
  }
  return null;
}
