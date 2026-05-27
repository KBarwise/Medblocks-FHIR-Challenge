import type { Condition } from '@/lib/fhir/resources';
import { isActiveCondition, conditionLabel } from '@/lib/clinical/conditions';
import { implicitValueSetUrl, validateCode } from '@/lib/terminology/snowstorm';
import { VALUE_SETS } from '@/lib/valuesets';

const SNOMED = 'http://snomed.info/sct';

export type ScreeningItem = {
  condition: Condition;
  level: 'red' | 'amber' | 'clear';
  label: string;
  reason: string;
};

export type ScreeningEvaluation = {
  overall: 'red' | 'amber' | 'clear';
  items: ScreeningItem[];
};

export async function evaluatePrescriptionScreening(
  conditions: Condition[],
): Promise<ScreeningEvaluation> {
  const active = conditions.filter(isActiveCondition);
  const absoluteUrl = implicitValueSetUrl(VALUE_SETS.absoluteContraindications.ecl);
  const cautionUrl = implicitValueSetUrl(VALUE_SETS.cautions.ecl);

  const items: ScreeningItem[] = await Promise.all(
    active.map(async condition => {
      const label = conditionLabel(condition);
      const coding = condition.code?.coding?.find(c => c.system?.includes('snomed.info/sct'));

      if (!coding?.code) {
        return {
          condition,
          level: 'clear',
          label,
          reason: 'No SNOMED code — manual review required',
        };
      }

      const [absolute, caution] = await Promise.all([
        validateCode({
          system: SNOMED,
          code: coding.code,
          display: coding.display,
          url: absoluteUrl,
        }),
        validateCode({
          system: SNOMED,
          code: coding.code,
          display: coding.display,
          url: cautionUrl,
        }),
      ]);

      if (absolute.result) {
        return {
          condition,
          level: 'red',
          label,
          reason: absolute.message ?? 'Matches absolute contraindication ValueSet',
        };
      }
      if (caution.result) {
        return {
          condition,
          level: 'amber',
          label,
          reason: caution.message ?? 'Matches caution ValueSet',
        };
      }
      return {
        condition,
        level: 'clear',
        label,
        reason: 'No match in contraindication or caution ValueSets',
      };
    }),
  );

  const overall: ScreeningEvaluation['overall'] = items.some(i => i.level === 'red')
    ? 'red'
    : items.some(i => i.level === 'amber')
      ? 'amber'
      : 'clear';

  return { overall, items };
}
