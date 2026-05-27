import { KIOSK_FAIL_HEADLINE } from '@/lib/kiosk/messages';
import { KIOSK_SCREENING_CONDITIONS } from '@/lib/kiosk/screening-conditions';
import type { ScreeningEvaluation, ScreeningItem } from './evaluate-prescription';

const SNOMED = 'http://snomed.info/sct';

const KIOSK_REASON: Record<string, string> = {
  '255032005': 'MEN 2 is an exclusion for GLP-1 therapy until specialist review.',
  '255075006': 'Personal or family history of medullary thyroid carcinoma requires specialist review.',
  '444561001': 'Planned surgery, anaesthetic, or dental procedures need timing review before starting therapy.',
  '77386006': 'GLP-1 therapy is not appropriate during pregnancy.',
  '414438008': 'Known allergy to GLP-1 medicines is an exclusion.',
};

/** Kiosk yes/no screening — any selected item fails pre-screening (red). */
export async function evaluateKioskScreening(
  selections: { code: string; display: string }[],
): Promise<ScreeningEvaluation> {
  if (selections.length === 0) {
    return { overall: 'clear', items: [] };
  }

  const known = new Map(KIOSK_SCREENING_CONDITIONS.map(c => [c.code, c]));

  const items: ScreeningItem[] = selections.map(sel => {
    const def = known.get(sel.code);
    const label = def?.display ?? sel.display;
    const stubCondition = {
      resourceType: 'Condition' as const,
      code: {
        coding: [{ system: SNOMED, code: sel.code, display: label }],
        text: label,
      },
      subject: { display: 'Kiosk pre-screening' },
    };

    return {
      condition: stubCondition,
      level: 'red' as const,
      label,
      reason: KIOSK_REASON[sel.code] ?? 'Does not meet self-screening criteria at this time',
    };
  });

  return { overall: 'red', items };
}

export function kioskScreeningPassed(overall: ScreeningEvaluation['overall']): boolean {
  return overall !== 'red';
}

export function screeningSummaryMessage(overall: ScreeningEvaluation['overall']): string {
  if (overall === 'red') return KIOSK_FAIL_HEADLINE;
  if (overall === 'amber') return 'Eligible with caution — proceed to reception';
  return 'Eligible — proceed to reception for registration';
}
