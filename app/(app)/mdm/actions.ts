'use server';

import { revalidatePath } from 'next/cache';
import { assertCanMergePatients } from '@/lib/clinic/access';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import {
  scanDuplicateGroups,
  mergePatients,
  mergeAllPatients,
  mergeAllDuplicateGroups,
  type MergeResult,
  type MergeAllResult,
  type MergeAllGroupsInput,
  type MergeAllGroupsResult,
} from '@/lib/fhir/mdm';

function assertMergeAccess(): void {
  assertCanMergePatients(getActingRoleFromCookie());
}

export async function runDuplicateScan() {
  assertMergeAccess();
  return scanDuplicateGroups();
}

export async function mergePatientRecords(
  masterId: string,
  sourceId: string,
): Promise<MergeResult> {
  assertMergeAccess();
  const result = await mergePatients(masterId, sourceId);
  revalidatePath('/mdm');
  revalidatePath('/patients');
  return result;
}

export async function mergeAllPatientRecords(
  masterId: string,
  sourceIds: string[],
): Promise<MergeAllResult> {
  assertMergeAccess();
  const result = await mergeAllPatients(masterId, sourceIds);
  revalidatePath('/mdm');
  revalidatePath('/patients');
  return result;
}

export async function mergeAllDuplicateGroupRecords(
  groups: MergeAllGroupsInput[],
): Promise<MergeAllGroupsResult> {
  assertMergeAccess();
  const result = await mergeAllDuplicateGroups(groups);
  revalidatePath('/mdm');
  revalidatePath('/patients');
  return result;
}
