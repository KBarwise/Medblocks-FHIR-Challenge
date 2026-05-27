import { ANTHROPOMETRICS, HEADER_LABS, POC_TESTS, VITAL_SIGNS } from './lab-catalog';
import { LOINC } from './observations';
import { URINALYSIS_POC } from './urinalysis-poc';

export const VITAL_LOINC_CODES = new Set(VITAL_SIGNS.map(v => v.code));

export const ANTHROPOMETRIC_LOINC_CODES = new Set(ANTHROPOMETRICS.map(a => a.code));

export const POC_LOINC_CODES = new Set([
  ...POC_TESTS.map(t => t.code),
  ...URINALYSIS_POC.map(u => u.loinc),
  LOINC.nursingNote,
]);

export const PRIORITY_LABORATORY_CODES = [
  LOINC.hba1c,
  HEADER_LABS.totalCholesterol.code,
  HEADER_LABS.alt.code,
  HEADER_LABS.lipase.code,
  HEADER_LABS.creatinine.code,
  HEADER_LABS.ast.code,
] as const;

const PRIORITY_LAB_SET = new Set<string>(PRIORITY_LABORATORY_CODES);

export function isVitalLoinc(code: string): boolean {
  return VITAL_LOINC_CODES.has(code);
}

export function isAnthropometricLoinc(code: string): boolean {
  return ANTHROPOMETRIC_LOINC_CODES.has(code);
}

export function isPocLoinc(code: string): boolean {
  return POC_LOINC_CODES.has(code);
}

export function isLaboratoryLoinc(code: string, category?: string): boolean {
  if (isVitalLoinc(code) || isAnthropometricLoinc(code) || isPocLoinc(code)) return false;
  const cat = category?.toLowerCase() ?? '';
  if (cat.includes('vital') || cat.includes('survey')) return false;
  return cat.includes('laboratory') || PRIORITY_LAB_SET.has(code);
}
