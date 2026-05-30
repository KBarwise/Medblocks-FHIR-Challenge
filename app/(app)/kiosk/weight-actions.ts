'use server';

import { revalidatePath } from 'next/cache';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { buildWeightLossSummary } from '@/lib/kiosk/weight-tracking';
import { findPatientByNameAndDob } from '@/lib/fhir/patient-search';
import { chartFhir } from '@/lib/fhir/chart-client';
import { formatFhirActionError } from '@/lib/fhir/error-message';
import { buildObservation, loinc } from '@/lib/fhir/builders';
import { LOINC, observationsByLoinc } from '@/lib/clinical/observations';
import { splitBundle } from '@/lib/signals/rules';
import type { Bundle, Observation } from '@/lib/fhir/resources';
import { fullName } from '@/lib/utils';

export type WeightProgressPayload = {
  patientId: string;
  patientName: string;
  summary: ReturnType<typeof buildWeightLossSummary>;
};

export type WeightActionResult =
  | { ok: true; data: WeightProgressPayload }
  | { ok: false; error: string };

function assertPatientKioskRole(): void {
  const role = getActingRoleFromCookie();
  if (role !== 'patient') {
    throw new Error('Weight tracking is only available in the patient kiosk.');
  }
}

async function resolvePatient(args: { given: string; family: string; birthDate: string }) {
  const patient = await findPatientByNameAndDob(args.given, args.family, args.birthDate);
  if (!patient?.id) {
    throw new Error('We could not find a matching patient. Check your name and date of birth.');
  }
  return patient;
}

async function loadWeightObservations(patientId: string): Promise<Observation[]> {
  const bundle = await chartFhir.search<Bundle<Observation>>('Observation', {
    patient: patientId,
    code: `http://loinc.org|${LOINC.bodyWeight}`,
    _count: 100,
  });
  return observationsByLoinc(splitBundle<Observation>(bundle, 'Observation'), LOINC.bodyWeight);
}

async function progressPayload(
  patient: Awaited<ReturnType<typeof resolvePatient>>,
): Promise<WeightProgressPayload> {
  const observations = await loadWeightObservations(patient.id!);
  return {
    patientId: patient.id!,
    patientName: fullName(patient),
    summary: buildWeightLossSummary(observations),
  };
}

export async function fetchPatientWeightProgress(args: {
  given: string;
  family: string;
  birthDate: string;
}): Promise<WeightActionResult> {
  try {
    assertPatientKioskRole();
    const patient = await resolvePatient(args);
    return { ok: true, data: await progressPayload(patient) };
  } catch (err) {
    return {
      ok: false,
      error: formatFhirActionError(err, 'Could not load your weight history.'),
    };
  }
}

export async function logPatientWeight(args: {
  given: string;
  family: string;
  birthDate: string;
  weightKg: number;
}): Promise<WeightActionResult> {
  try {
    assertPatientKioskRole();

    const weightKg = args.weightKg;
    if (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 400) {
      return { ok: false, error: 'Please enter a weight between 25 and 400 kg.' };
    }

    const patient = await resolvePatient(args);
    const patientId = patient.id!;

    await chartFhir.create<Observation>(
      'Observation',
      buildObservation({
        patientId,
        code: loinc(LOINC.bodyWeight, 'Body weight'),
        value: Math.round(weightKg * 10) / 10,
        unit: 'kg',
        category: 'vital-signs',
      }),
    );

    revalidatePath('/kiosk/track-weight');

    return { ok: true, data: await progressPayload(patient) };
  } catch (err) {
    return {
      ok: false,
      error: formatFhirActionError(err, 'Could not save your weight. Try again or ask reception.'),
    };
  }
}