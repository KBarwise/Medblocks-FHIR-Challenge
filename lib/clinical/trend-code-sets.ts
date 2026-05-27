import { ANTHROPOMETRICS, HEADER_LABS, VITAL_SIGNS } from './lab-catalog';
import { LOINC } from './observations';

export const VITAL_LOINC_CODES = new Set(VITAL_SIGNS.map(v => v.code));

export const ANTHROPOMETRIC_LOINC_CODES = new Set(ANTHROPOMETRICS.map(a => a.code));


const PRIORITY_LAB_SET = new Set<string>([
  LOINC.hba1c,
  HEADER_LABS.totalCholesterol.code,
  HEADER_LABS.alt.code,
  HEADER_LABS.lipase.code,
  HEADER_LABS.creatinine.code,
]);

export function isLaboratoryLoinc(code: string, category?: string): boolean {
  if (VITAL_LOINC_CODES.has(code) || ANTHROPOMETRIC_LOINC_CODES.has(code)) {
    return false;
  }
  const cat = category?.toLowerCase() ?? '';
  if (cat.includes('vital') || cat.includes('survey')) return false;
  return cat.includes('laboratory') || PRIORITY_LAB_SET.has(code);
}

export const VITAL_TREND_OPTIONS = [
  ...VITAL_SIGNS.map(v => ({ code: v.code, display: v.display })),
  ...ANTHROPOMETRICS.map(a => ({ code: a.code, display: a.display })),
];

export const DEFAULT_VITAL_TREND_SELECTION = ['8480-6', '8462-4', '8867-4', '39156-5'];

