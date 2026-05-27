import { fhir } from './client';
import type { Bundle, Patient } from './resources';
import { listAllPatients } from './patients';

export type { DuplicateGroup } from './mdm-types';
export { patientSummary } from './mdm-types';

import type { DuplicateGroup } from './mdm-types';

export type DuplicateScanResult = {
  groups: DuplicateGroup[];
  scanned: number;
  truncated: boolean;
  error?: string;
};

function normalizeKey(p: Patient): string {
  const family = (p.name?.[0]?.family ?? '').trim().toLowerCase();
  const birth = p.birthDate ?? '';
  const given = (p.name?.[0]?.given ?? []).join(' ').trim().toLowerCase();
  return `${family}|${birth}|${given}`;
}

function mrn(p: Patient): string | undefined {
  return (
    p.identifier?.find(i => i.type?.coding?.some(c => c.code === 'MR'))?.value
    ?? p.identifier?.[0]?.value
  );
}

function samePatientSet(a: Patient[], b: Patient[]): boolean {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map(p => p.id));
  return b.every(p => ids.has(p.id));
}

/** Group patients by name+DOB and by shared MRN. */
export function groupDuplicatesFromPatients(patients: Patient[]): DuplicateGroup[] {
  const byKey = new Map<string, Patient[]>();
  for (const p of patients) {
    if (!p.birthDate) continue;
    const key = normalizeKey(p);
    if (key.startsWith('|')) continue;
    const list = byKey.get(key) ?? [];
    if (!list.some(x => x.id === p.id)) list.push(p);
    byKey.set(key, list);
  }

  const groups: DuplicateGroup[] = [];
  for (const [key, list] of byKey) {
    if (list.length < 2) continue;
    groups.push({
      key,
      patients: list,
      reason: 'Same name and date of birth',
    });
  }

  const byMrn = new Map<string, Patient[]>();
  for (const p of patients) {
    const id = mrn(p);
    if (!id) continue;
    const list = byMrn.get(id) ?? [];
    if (!list.some(x => x.id === p.id)) list.push(p);
    byMrn.set(id, list);
  }
  for (const [id, list] of byMrn) {
    if (list.length < 2) continue;
    if (groups.some(g => samePatientSet(g.patients, list))) continue;
    groups.push({
      key: `mrn:${id}`,
      patients: list,
      reason: 'Same MRN on multiple records',
    });
  }

  return groups;
}

/** Scan the full patient directory (paginated) for duplicate groups. */
export async function scanDuplicateGroups(opts?: { max?: number }): Promise<DuplicateScanResult> {
  const max = opts?.max ?? 2000;
  const { patients, truncated, error } = await listAllPatients({ max });
  if (error) {
    return { groups: [], scanned: 0, truncated: false, error };
  }
  return {
    groups: groupDuplicatesFromPatients(patients),
    scanned: patients.length,
    truncated,
  };
}

/** Narrow duplicate groups from a name search (optional filter). */
export async function findDuplicateGroupsBySearch(query: string): Promise<DuplicateGroup[]> {
  if (query.trim().length < 2) return [];

  const params: Record<string, string | number> = { _count: 100, name: query.trim() };
  const bundle = await fhir.search<Bundle<Patient>>('Patient', params);
  const patients = (bundle.entry ?? [])
    .map(e => e.resource)
    .filter((r): r is Patient => r?.resourceType === 'Patient' && Boolean(r.id));

  return groupDuplicatesFromPatients(patients);
}

export type MergeResult = {
  ok: boolean;
  message: string;
  masterId?: string;
  mergedId?: string;
};

export type MergeAllResult = {
  ok: boolean;
  message: string;
  masterId: string;
  merged: string[];
  failed: Array<{ sourceId: string; message: string }>;
};

export type MergeAllGroupsInput = {
  masterId: string;
  sourceIds: string[];
};

export type MergeAllGroupsResult = {
  ok: boolean;
  message: string;
  groupsProcessed: number;
  recordsMerged: number;
  groupsWithFailures: number;
  failures: Array<{ masterId: string; sourceId?: string; message: string }>;
};

/** Merge source patient into master via HAPI $merge, with manual fallback. */
export async function mergePatients(masterId: string, sourceId: string): Promise<MergeResult> {
  if (masterId === sourceId) {
    return { ok: false, message: 'Cannot merge a record with itself' };
  }

  const attempts: Array<{ parameter: Array<Record<string, unknown>> }> = [
    {
      parameter: [
        { name: 'targetPatientId', valueString: masterId },
        { name: 'sourcePatientId', valueString: sourceId },
      ],
    },
    {
      parameter: [
        { name: 'master', valueString: masterId },
        { name: 'duplicate', valueString: sourceId },
      ],
    },
  ];

  for (const body of attempts) {
    try {
      await fhir.raw('/Patient/$merge', {
        method: 'POST',
        body: { resourceType: 'Parameters', ...body },
      });
      return {
        ok: true,
        message: `Merged Patient/${sourceId} into Patient/${masterId}`,
        masterId,
        mergedId: sourceId,
      };
    } catch {
      /* try next parameter shape */
    }
  }

  try {
    const [master, source] = await Promise.all([
      fhir.read<Patient>('Patient', masterId),
      fhir.read<Patient>('Patient', sourceId),
    ]);
    const identifiers = [...(master.identifier ?? [])];
    for (const id of source.identifier ?? []) {
      if (!identifiers.some(i => i.system === id.system && i.value === id.value)) {
        identifiers.push(id);
      }
    }
    await fhir.update<Patient>('Patient', masterId, {
      ...master,
      identifier: identifiers,
    });
    await fhir.update<Patient>('Patient', sourceId, {
      ...source,
      active: false,
    });
    return {
      ok: true,
      message: `Linked identifiers on Patient/${masterId} and marked Patient/${sourceId} inactive (server $merge not available)`,
      masterId,
      mergedId: sourceId,
    };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** Merge every source record into the master, one after another. */
export async function mergeAllPatients(
  masterId: string,
  sourceIds: string[],
): Promise<MergeAllResult> {
  const sources = sourceIds.filter(id => id && id !== masterId);
  const merged: string[] = [];
  const failed: Array<{ sourceId: string; message: string }> = [];

  for (const sourceId of sources) {
    const result = await mergePatients(masterId, sourceId);
    if (result.ok) merged.push(sourceId);
    else failed.push({ sourceId, message: result.message });
  }

  const ok = failed.length === 0;
  let message: string;
  if (sources.length === 0) {
    message = 'No duplicate records to merge';
  } else if (ok) {
    message = `Merged ${merged.length} record${merged.length === 1 ? '' : 's'} into Patient/${masterId}`;
  } else if (merged.length === 0) {
    message = `All merges failed for Patient/${masterId}`;
  } else {
    message = `Merged ${merged.length} of ${sources.length} into Patient/${masterId}; ${failed.length} failed`;
  }

  return { ok, message, masterId, merged, failed };
}

/** Merge all duplicate groups (each group's extras into its primary). */
export async function mergeAllDuplicateGroups(
  groups: MergeAllGroupsInput[],
): Promise<MergeAllGroupsResult> {
  let recordsMerged = 0;
  let groupsWithFailures = 0;
  const failures: MergeAllGroupsResult['failures'] = [];

  for (const { masterId, sourceIds } of groups) {
    const result = await mergeAllPatients(masterId, sourceIds);
    recordsMerged += result.merged.length;
    if (!result.ok) {
      groupsWithFailures += 1;
      for (const f of result.failed) {
        failures.push({ masterId, sourceId: f.sourceId, message: f.message });
      }
    }
  }

  const groupsProcessed = groups.length;
  const ok = groupsWithFailures === 0;
  let message: string;
  if (groupsProcessed === 0) {
    message = 'No duplicate groups to merge';
  } else if (ok) {
    message = `Merged ${recordsMerged} duplicate record${recordsMerged === 1 ? '' : 's'} across ${groupsProcessed} group${groupsProcessed === 1 ? '' : 's'}`;
  } else {
    message = `Merged ${recordsMerged} record${recordsMerged === 1 ? '' : 's'} across ${groupsProcessed} groups; ${groupsWithFailures} group${groupsWithFailures === 1 ? '' : 's'} had failures`;
  }

  return {
    ok,
    message,
    groupsProcessed,
    recordsMerged,
    groupsWithFailures,
    failures,
  };
}

