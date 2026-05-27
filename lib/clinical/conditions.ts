import type { Condition } from '@/lib/fhir/resources';

export function isActiveCondition(condition: Condition): boolean {
  const code = condition.clinicalStatus?.coding?.[0]?.code;
  return !code || code === 'active' || code === 'recurrence';
}

function snomedCoding(condition: Condition) {
  return condition.code?.coding?.find(c => c.system?.includes('snomed.info/sct'));
}

export function conditionLabel(condition: Condition): string {
  return condition.code?.text ?? condition.code?.coding?.[0]?.display ?? 'Condition';
}

export function conditionSnomedCode(condition: Condition): string | undefined {
  return snomedCoding(condition)?.code;
}

const VERIFICATION_LABELS: Record<string, string> = {
  unconfirmed: 'Suspected',
  confirmed: 'Confirmed',
  provisional: 'Provisional',
  differential: 'Differential',
};

const CLINICAL_LABELS: Record<string, string> = {
  active: 'Active',
  recurrence: 'Recurrence',
  relapse: 'Relapse',
  inactive: 'Inactive',
  remission: 'Remission',
  resolved: 'Resolved',
};

/** Human-readable qualifiers for problem list display. */
export function conditionQualifierSummary(condition: Condition): string | null {
  const parts: string[] = [];
  const clinical = condition.clinicalStatus?.coding?.[0]?.code;
  const verification = condition.verificationStatus?.coding?.[0]?.code;
  if (clinical && CLINICAL_LABELS[clinical]) parts.push(CLINICAL_LABELS[clinical]);
  if (verification && VERIFICATION_LABELS[verification]) parts.push(VERIFICATION_LABELS[verification]);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function isProblemListItem(condition: Condition): boolean {
  return condition.category?.some(c =>
    c.coding?.some(co => co.code === 'problem-list-item'),
  ) ?? false;
}

/** One entry per SNOMED code — prefer problem-list items, then most recently recorded. */
export function dedupeConditionsBySnomedCode(conditions: Condition[]): Condition[] {
  const byCode = new Map<string, Condition>();

  for (const condition of conditions) {
    const code = conditionSnomedCode(condition);
    if (!code) continue;

    const existing = byCode.get(code);
    if (!existing) {
      byCode.set(code, condition);
      continue;
    }

    const preferNew =
      (isProblemListItem(condition) && !isProblemListItem(existing))
      || (condition.recordedDate ?? '') > (existing.recordedDate ?? '');
    if (preferNew) byCode.set(code, condition);
  }

  return [...byCode.values()].sort((a, b) =>
    conditionLabel(a).localeCompare(conditionLabel(b)),
  );
}

export function activeProblemSnomedCodes(conditions: Condition[]): Set<string> {
  const codes = new Set<string>();
  for (const c of conditions) {
    if (!isActiveCondition(c)) continue;
    const code = conditionSnomedCode(c);
    if (code) codes.add(code);
  }
  return codes;
}
