'use server';

import { revalidatePath } from 'next/cache';
import { canViewClinicalData } from '@/lib/clinic/access';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { conditionSnomedCode, isProblemListItem } from '@/lib/clinical/conditions';
import { loadProblemListConditions } from '@/lib/clinical/conditions-server';
import type { ProblemListDiagnosis } from '@/lib/clinical/diagnosis-qualifiers';
import { applyConditionQualifiers, buildCondition } from '@/lib/fhir/builders';
import { clinicalFhir } from '@/lib/fhir/client';
import type { Bundle, Condition } from '@/lib/fhir/resources';

function assertClinicalWrite(): void {
  if (!canViewClinicalData(getActingRoleFromCookie())) {
    throw new Error('You do not have permission to edit the problem list.');
  }
}

function revalidatePatient(patientId: string) {
  revalidatePath(`/patient/${patientId}`);
  revalidatePath(`/patient/${patientId}/consult`);
  revalidatePath(`/patient/${patientId}/consult/document`);
}

async function listPatientConditions(patientId: string): Promise<Condition[]> {
  const bundle = await clinicalFhir.search<Bundle<Condition>>('Condition', {
    patient: patientId,
    _count: 200,
  }).catch(() => ({ resourceType: 'Bundle' as const, type: 'searchset' as const, entry: [] }));

  return (bundle.entry ?? [])
    .map(e => e.resource)
    .filter((r): r is Condition => r?.resourceType === 'Condition');
}

export async function addProblemListItem(
  patientId: string,
  diagnosis: ProblemListDiagnosis,
): Promise<{ ok: true; conditionId: string }> {
  assertClinicalWrite();

  const existing = await loadProblemListConditions(await listPatientConditions(patientId));
  const match = existing.find(c => conditionSnomedCode(c) === diagnosis.code);

  if (match?.id) {
    const updated = applyConditionQualifiers(match, {
      clinicalStatus: diagnosis.clinicalStatus,
      verification: diagnosis.verification,
    });
    await clinicalFhir.update<Condition>('Condition', match.id, updated);
    revalidatePatient(patientId);
    return { ok: true, conditionId: match.id };
  }

  const created = await clinicalFhir.create<Condition>(
    'Condition',
    buildCondition({
      patientId,
      code: { code: diagnosis.code, display: diagnosis.display },
      category: 'problem-list-item',
      verification: diagnosis.verification,
      clinicalStatus: diagnosis.clinicalStatus,
    }),
  );
  const id = created.id;
  if (!id) throw new Error('Problem list item was not created.');

  revalidatePatient(patientId);
  return { ok: true, conditionId: id };
}

export async function updateProblemListItem(
  conditionId: string,
  patientId: string,
  patch: Pick<ProblemListDiagnosis, 'clinicalStatus' | 'verification'>,
): Promise<{ ok: true }> {
  assertClinicalWrite();

  const condition = await clinicalFhir.read<Condition>('Condition', conditionId);
  if (!isProblemListItem(condition)) {
    throw new Error('Only problem-list conditions can be edited here.');
  }

  const updated = applyConditionQualifiers(condition, {
    clinicalStatus: patch.clinicalStatus,
    verification: patch.verification,
  });
  await clinicalFhir.update<Condition>('Condition', conditionId, updated);
  revalidatePatient(patientId);
  return { ok: true };
}

/** Mark inactive (removed from active problem list; record retained). */
export async function removeProblemListItem(
  conditionId: string,
  patientId: string,
): Promise<{ ok: true }> {
  assertClinicalWrite();

  const condition = await clinicalFhir.read<Condition>('Condition', conditionId);
  if (!isProblemListItem(condition)) {
    throw new Error('Only problem-list conditions can be removed here.');
  }

  const updated = applyConditionQualifiers(condition, {
    clinicalStatus: 'inactive',
    verification:
      (condition.verificationStatus?.coding?.[0]?.code as ProblemListDiagnosis['verification'])
      ?? 'confirmed',
  });
  await clinicalFhir.update<Condition>('Condition', conditionId, updated);
  revalidatePatient(patientId);
  return { ok: true };
}
