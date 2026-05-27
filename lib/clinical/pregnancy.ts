import type { Patient } from '@/lib/fhir/resources';
import { ageFromBirthDate } from '@/lib/utils';

export const DEFAULT_CHILD_BEARING_AGE = { minYears: 15, maxYears: 49 } as const;

function isFemale(patient: Patient): boolean {
  const g = patient.gender;
  if (!g) return false;
  return g.toLowerCase() === 'female';
}

/**
 * We show pregnancy screening only for female patients in child-bearing age.
 *
 * If you want different bounds, tweak `DEFAULT_CHILD_BEARING_AGE`.
 */
export function isPregnancyApplicable(
  patient: Patient,
  bounds = DEFAULT_CHILD_BEARING_AGE,
): boolean {
  if (!isFemale(patient)) return false;

  const age = ageFromBirthDate(patient.birthDate);
  if (age === undefined) return false;

  return age >= bounds.minYears && age <= bounds.maxYears;
}

