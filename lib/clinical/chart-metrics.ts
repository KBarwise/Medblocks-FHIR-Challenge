import { ANTHROPOMETRICS, HEADER_LABS, VITAL_SIGNS } from './lab-catalog';
import { LOINC } from './observations';
import { URINALYSIS_POC } from './urinalysis-poc';

export type ChartMetricGroup = 'vitals' | 'anthropometrics' | 'laboratory' | 'poc';

export type ChartMetricKind = 'quantity' | 'coded';

export type ChartMetric = {
  id: string;
  loinc: string;
  label: string;
  unit: string;
  group: ChartMetricGroup;
  kind: ChartMetricKind;
  refLow?: number;
  refHigh?: number;
};

const quantityMetric = (
  id: string,
  loinc: string,
  label: string,
  unit: string,
  group: ChartMetricGroup,
  ref?: { refLow?: number; refHigh?: number },
): ChartMetric => ({
  id,
  loinc,
  label,
  unit,
  group,
  kind: 'quantity',
  ...ref,
});

export const CHART_METRICS: readonly ChartMetric[] = [
  ...VITAL_SIGNS.map(v =>
    quantityMetric(`vital-${v.code}`, v.code, v.display, v.unit, 'vitals', {
      refLow: v.refLow,
      refHigh: v.refHigh,
    }),
  ),
  ...ANTHROPOMETRICS.filter(a => a.code !== '39156-5').map(a =>
    quantityMetric(`anthro-${a.code}`, a.code, a.display, a.unit, 'anthropometrics'),
  ),
  quantityMetric('anthro-bmi', LOINC.bmi, 'BMI', 'kg/m2', 'anthropometrics'),
  quantityMetric(
    'poc-glucose',
    LOINC.bloodGlucosePoc,
    'Blood glucose (POC)',
    'mg/dL',
    'poc',
    { refLow: 70, refHigh: 140 },
  ),
  quantityMetric('lab-hba1c', LOINC.hba1c, 'HbA1c', '%', 'laboratory'),
  ...Object.values(HEADER_LABS).map(lab =>
    quantityMetric(`lab-${lab.code}`, lab.code, lab.display, lab.unit, 'laboratory', {
      refLow: lab.refLow,
      refHigh: lab.refHigh,
    }),
  ),
  ...URINALYSIS_POC.map(f => ({
    id: `ua-${f.loinc}`,
    loinc: f.loinc,
    label: f.display,
    unit: '',
    group: 'poc' as const,
    kind: 'coded' as const,
  })),
  {
    id: 'poc-pregnancy',
    loinc: LOINC.pregnancyTest,
    label: 'Pregnancy test',
    unit: '',
    group: 'poc',
    kind: 'coded',
  },
];

export const DEFAULT_CHART_METRIC_IDS = [
  'vital-8480-6',
  'vital-8462-4',
  'anthro-29463-7',
  'anthro-bmi',
  'poc-glucose',
  'lab-2093-3',
  'lab-1742-6',
  'lab-3040-3',
];

export const CHART_GROUP_LABELS: Record<ChartMetricGroup, string> = {
  vitals: 'Vital signs',
  anthropometrics: 'Anthropometrics',
  laboratory: 'Laboratory',
  poc: 'Point of care',
};

export function chartMetricById(id: string): ChartMetric | undefined {
  return CHART_METRICS.find(m => m.id === id);
}
