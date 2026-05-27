/** Point-of-care urinalysis dipstick — one FHIR Observation per analyte (LOINC). */

export type UrinalysisFieldKind = 'select' | 'text';

export type UrinalysisField = {
  loinc: string;
  display: string;
  kind: UrinalysisFieldKind;
  options?: readonly string[];
  normal: string;
  placeholder?: string;
};

export const URINALYSIS_POC: readonly UrinalysisField[] = [
  {
    loinc: '5778-6',
    display: 'Color',
    kind: 'select',
    options: ['Yellow', 'Straw', 'Amber', 'Colorless', 'Other'],
    normal: 'Yellow',
  },
  {
    loinc: '5767-9',
    display: 'Appearance',
    kind: 'select',
    options: ['Clear', 'Slightly cloudy', 'Cloudy', 'Turbid'],
    normal: 'Clear',
  },
  {
    loinc: '5811-5',
    display: 'Specific gravity',
    kind: 'text',
    normal: '1.015',
    placeholder: '1.005–1.030',
  },
  {
    loinc: '5803-2',
    display: 'pH',
    kind: 'text',
    normal: '6.0',
    placeholder: '4.5–8.0',
  },
  {
    loinc: '5804-0',
    display: 'Protein',
    kind: 'select',
    options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
    normal: 'Negative',
  },
  {
    loinc: '5792-7',
    display: 'Glucose',
    kind: 'select',
    options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
    normal: 'Negative',
  },
  {
    loinc: '5797-6',
    display: 'Ketones',
    kind: 'select',
    options: ['Negative', 'Trace', '1+', '2+', '3+'],
    normal: 'Negative',
  },
  {
    loinc: '5770-3',
    display: 'Bilirubin',
    kind: 'select',
    options: ['Negative', 'Positive', '1+', '2+', '3+'],
    normal: 'Negative',
  },
  {
    loinc: '5794-3',
    display: 'Blood / hemoglobin',
    kind: 'select',
    options: ['Negative', 'Trace', '1+', '2+', '3+'],
    normal: 'Negative',
  },
  {
    loinc: '5802-4',
    display: 'Nitrite',
    kind: 'select',
    options: ['Negative', 'Positive'],
    normal: 'Negative',
  },
  {
    loinc: '5799-2',
    display: 'Leukocyte esterase',
    kind: 'select',
    options: ['Negative', 'Trace', '1+', '2+', '3+'],
    normal: 'Negative',
  },
  {
    loinc: '20405-7',
    display: 'Urobilinogen',
    kind: 'select',
    options: ['Normal', '1+', '2+', '3+', '4+'],
    normal: 'Normal',
  },
] as const;

export function emptyUrinalysisValues(): Record<string, string> {
  return Object.fromEntries(URINALYSIS_POC.map(f => [f.loinc, '']));
}

export function urinalysisNormalValues(): Record<string, string> {
  return Object.fromEntries(URINALYSIS_POC.map(f => [f.loinc, f.normal]));
}

export function urinalysisHasAnyValue(values: Record<string, string>): boolean {
  return Object.values(values).some(v => v.trim());
}
