import { fhir } from './client';
import type { Bundle, Patient } from './resources';
import { fullName } from '@/lib/utils';
import { DEFAULT_MRN_SYSTEM, type PatientFormData } from './us-core-patient';
import { validatePatientFormFields } from './us-core-patient';

/** FHIR token search: `system|value` */
export function mrnIdentifierToken(mrnSystem: string, mrnValue: string): string {
  const system = mrnSystem.trim() || DEFAULT_MRN_SYSTEM;
  const value = mrnValue.trim();
  return `${system}|${value}`;
}

export async function findPatientsByMrn(
  mrnSystem: string,
  mrnValue: string,
  count = 10,
): Promise<Patient[]> {
  const value = mrnValue.trim();
  if (!value) return [];

  const bundle = await fhir.search<Bundle<Patient>>('Patient', {
    identifier: mrnIdentifierToken(mrnSystem, value),
    _count: count,
  });

  return (bundle.entry ?? [])
    .map(e => e.resource)
    .filter((r): r is Patient => r?.resourceType === 'Patient' && Boolean(r.id));
}

/** Another patient (any status) already using this MRN. */
export async function findMrnConflict(
  mrnSystem: string,
  mrnValue: string,
  excludePatientId?: string,
): Promise<Patient | null> {
  const matches = await findPatientsByMrn(mrnSystem, mrnValue);
  return matches.find(p => p.id && p.id !== excludePatientId) ?? null;
}

export function mrnConflictMessage(conflict: Patient, mrnValue: string): string {
  const who = fullName(conflict);
  return `MRN ${mrnValue.trim()} is already assigned to ${who} (Patient/${conflict.id}). Choose a different MRN.`;
}

export async function assertMrnUnique(
  form: Pick<PatientFormData, 'mrnSystem' | 'mrnValue'>,
  excludePatientId?: string,
): Promise<void> {
  const value = form.mrnValue.trim();
  if (!value) return;

  const conflict = await findMrnConflict(form.mrnSystem, value, excludePatientId);
  if (conflict) {
    throw new Error(mrnConflictMessage(conflict, value));
  }
}

/** Sync field rules plus FHIR MRN uniqueness check before create/update. */
export async function validatePatientFormForSave(
  form: PatientFormData,
  excludePatientId?: string,
): Promise<string | null> {
  const fieldErrors = validatePatientFormFields(form);
  const first = Object.values(fieldErrors)[0];
  if (first) return first;

  try {
    await assertMrnUnique(form, excludePatientId);
  } catch (e) {
    return (e as Error).message;
  }

  return null;
}
