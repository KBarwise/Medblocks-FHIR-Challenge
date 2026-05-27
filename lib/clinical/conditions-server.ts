import type { Condition } from '@/lib/fhir/resources';
import { implicitValueSetUrl } from '@/lib/terminology/ecl';
import { validateCode } from '@/lib/terminology/snowstorm';
import {
  dedupeConditionsBySnomedCode,
  isActiveCondition,
  isProblemListItem,
} from './conditions';

const SNOMED = 'http://snomed.info/sct';

/** SNOMED ECL: diseases / disorders (validated on Snowstorm). */
export const DISORDER_ECL = '<<64572001';

const EXCLUDED_ECLS = {
  situation: '<<243796009',
  event: '<<272379006',
  procedure: '<<71388002',
} as const;

type ValidateCache = Map<string, boolean>;

function snomedCoding(condition: Condition) {
  return condition.code?.coding?.find(c => c.system?.includes('snomed.info/sct'));
}

function looksLikeNonDisorder(condition: Condition): boolean {
  const label =
    condition.code?.text ?? condition.code?.coding?.[0]?.display ?? 'Condition';
  return /\((finding|situation|observable entity|procedure|event)\)/i.test(label);
}

async function validateMembership(
  cache: ValidateCache,
  code: string,
  display: string | undefined,
  ecl: string,
): Promise<boolean> {
  const key = `${ecl}::${code}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const { result } = await validateCode({
    system: SNOMED,
    code,
    display,
    url: implicitValueSetUrl(ecl),
  });
  cache.set(key, result);
  return result;
}

async function isDisorderCondition(condition: Condition, cache: ValidateCache): Promise<boolean> {
  const coding = snomedCoding(condition);
  if (!coding?.code) return false;
  if (looksLikeNonDisorder(condition)) return false;

  const inDisorder = await validateMembership(cache, coding.code, coding.display, DISORDER_ECL);
  if (!inDisorder) return false;

  for (const ecl of Object.values(EXCLUDED_ECLS)) {
    const excluded = await validateMembership(cache, coding.code, coding.display, ecl);
    if (excluded) return false;
  }

  return true;
}

/** SNOMED disorder conditions (optionally active only). */
export async function filterDisorderConditions(
  conditions: Condition[],
  opts?: { activeOnly?: boolean },
): Promise<Condition[]> {
  const activeOnly = opts?.activeOnly !== false;
  const scoped = activeOnly ? conditions.filter(isActiveCondition) : conditions;
  const cache: ValidateCache = new Map();

  const checked = await Promise.all(
    scoped.map(async condition => {
      const ok = await isDisorderCondition(condition, cache);
      return ok ? condition : null;
    }),
  );

  return checked.filter((c): c is Condition => c !== null);
}

/** Problem-list items (all clinical statuses) deduped by SNOMED code. */
export async function loadProblemListConditions(conditions: Condition[]): Promise<Condition[]> {
  const items = conditions.filter(isProblemListItem);
  const disorders = await filterDisorderConditions(items, { activeOnly: false });
  return dedupeConditionsBySnomedCode(disorders);
}
