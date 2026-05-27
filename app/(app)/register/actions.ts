'use server';

import { revalidatePath } from 'next/cache';
import { fhir } from '@/lib/fhir/client';
import type { Patient } from '@/lib/fhir/resources';
import {
  findMrnConflict,
  mrnConflictMessage,
  validatePatientFormForSave,
} from '@/lib/fhir/patient-mrn';
import {
  autosaveBlockingErrors,
  buildUsCorePatient,
  canCreatePatientDraft,
  DEFAULT_MRN_SYSTEM,
  generateMrn,
  parseUsCorePatient,
  validatePatientFormFields,
  type PatientFormData,
} from '@/lib/fhir/us-core-patient';
import { assertCanEditDemographics } from '@/lib/clinic/access';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { completeKioskIntakeRegistration } from '@/app/(app)/kiosk/actions';

export async function checkMrnAvailable(
  mrnSystem: string,
  mrnValue: string,
  excludePatientId?: string,
): Promise<{ available: boolean; message?: string }> {
  assertCanEditDemographics(getActingRoleFromCookie());
  const value = mrnValue.trim();
  if (!value) {
    return { available: false, message: 'MRN is required' };
  }

  const conflict = await findMrnConflict(mrnSystem, value, excludePatientId);
  if (conflict) {
    return { available: false, message: mrnConflictMessage(conflict, value) };
  }
  return { available: true };
}

export async function generateUniqueMrn(mrnSystem?: string): Promise<string> {
  assertCanEditDemographics(getActingRoleFromCookie());
  const system = mrnSystem?.trim() || DEFAULT_MRN_SYSTEM;

  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = generateMrn();
    const conflict = await findMrnConflict(system, candidate);
    if (!conflict) return candidate;
  }

  throw new Error('Could not generate a unique MRN. Try again or enter one manually.');
}

export async function createPatient(
  form: PatientFormData,
  kioskIntakeId?: string,
): Promise<Patient> {
  assertCanEditDemographics(getActingRoleFromCookie());
  const err = await validatePatientFormForSave(form);
  if (err) throw new Error(err);

  const resource = buildUsCorePatient(form);
  const created = await fhir.create<Patient>('Patient', resource);
  if (kioskIntakeId && created.id) {
    await completeKioskIntakeRegistration(kioskIntakeId, created.id);
  }
  revalidatePath('/cohort');
  revalidatePath('/register');
  revalidatePath('/reception');
  return created;
}

export async function updatePatient(
  id: string,
  form: PatientFormData,
  kioskIntakeId?: string,
): Promise<Patient> {
  assertCanEditDemographics(getActingRoleFromCookie());
  const err = await validatePatientFormForSave(form, id);
  if (err) throw new Error(err);

  const existing = await fhir.read<Patient>('Patient', id);
  const resource = buildUsCorePatient(form, existing);
  const updated = await fhir.update<Patient>('Patient', id, resource);
  if (kioskIntakeId) {
    await completeKioskIntakeRegistration(kioskIntakeId, id);
  }
  revalidatePath('/cohort');
  revalidatePath('/register');
  revalidatePath('/reception');
  revalidatePath(`/register/${id}`);
  revalidatePath(`/patient/${id}`);
  return updated;
}

export async function loadPatientForEdit(id: string): Promise<PatientFormData | null> {
  try {
    const patient = await fhir.read<Patient>('Patient', id);
    return parseUsCorePatient(patient);
  } catch {
    return null;
  }
}

/** Debounced step save — creates a draft on first write, then updates. */
export async function persistPatientDraft(
  patientId: string | undefined,
  form: PatientFormData,
): Promise<{ id: string; created: boolean } | null> {
  assertCanEditDemographics(getActingRoleFromCookie());

  const fieldErrors = validatePatientFormFields(form);
  if (autosaveBlockingErrors(fieldErrors)) return null;

  const mrnErr = await validatePatientFormForSave(form, patientId);
  if (mrnErr) throw new Error(mrnErr);

  if (!patientId) {
    if (!canCreatePatientDraft(form) || fieldErrors.name) return null;
    const resource = buildUsCorePatient(form);
    const created = await fhir.create<Patient>('Patient', resource);
    if (!created.id) return null;
    revalidatePath('/register');
    revalidatePath(`/register/${created.id}`);
    return { id: created.id, created: true };
  }

  const existing = await fhir.read<Patient>('Patient', patientId);
  const resource = buildUsCorePatient(form, existing);
  const updated = await fhir.update<Patient>('Patient', patientId, resource);
  revalidatePath('/register');
  revalidatePath(`/register/${patientId}`);
  revalidatePath(`/patient/${patientId}`);
  return { id: updated.id ?? patientId, created: false };
}
