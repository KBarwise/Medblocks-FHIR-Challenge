import type { Condition } from '@/lib/fhir/resources';
import { conditionSnomedCode } from './conditions';

/** Unique conditions by SNOMED code for prescription screening. */
export function conditionsForPrescriptionScreening(conditions: Condition[]): Condition[] {
  const byCode = new Map<string, Condition>();
  for (const c of conditions) {
    const key = conditionSnomedCode(c) ?? c.id ?? '';
    if (!key) continue;
    if (!byCode.has(key)) byCode.set(key, c);
  }
  return [...byCode.values()];
}
