import type { Patient } from './resources';

/** FHIR `active: false` — omitted or true counts as active for directory/search. */
export function isActivePatient(p: Patient): boolean {
  return p.active !== false;
}

function dedupeKey(p: Patient): string | undefined {
  const family = (p.name?.[0]?.family ?? '').trim().toLowerCase();
  const given = (p.name?.[0]?.given ?? []).join(' ').trim().toLowerCase();
  const birth = p.birthDate ?? '';
  if (!birth || (!family && !given)) return undefined;
  return `${family}|${birth}|${given}`;
}

function identifierCount(p: Patient): number {
  return p.identifier?.length ?? 0;
}

/** When multiple records match the same person, keep the best primary chart. */
export function pickPreferredPatient(candidates: Patient[]): Patient {
  const sorted = [...candidates].sort((a, b) => {
    const aActive = isActivePatient(a) ? 1 : 0;
    const bActive = isActivePatient(b) ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    const idDiff = identifierCount(b) - identifierCount(a);
    if (idDiff !== 0) return idDiff;
    return (a.id ?? '').localeCompare(b.id ?? '');
  });
  return sorted[0];
}

/** Collapse inactive / duplicate rows so search and lists show one patient per person. */
export function dedupePatientRecords(patients: Patient[]): Patient[] {
  const withoutKey: Patient[] = [];
  const byKey = new Map<string, Patient[]>();

  for (const p of patients) {
    const key = dedupeKey(p);
    if (!key) {
      withoutKey.push(p);
      continue;
    }
    const list = byKey.get(key) ?? [];
    if (!list.some(x => x.id === p.id)) list.push(p);
    byKey.set(key, list);
  }

  const merged: Patient[] = [...withoutKey];
  for (const list of byKey.values()) {
    merged.push(list.length === 1 ? list[0] : pickPreferredPatient(list));
  }

  return merged;
}
