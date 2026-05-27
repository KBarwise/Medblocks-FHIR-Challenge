/** LOINC codes and reference ranges for vitals, labs, and orderable panels. */

export type LabAnalyte = {
  code: string;
  display: string;
  unit: string;
  refLow?: number;
  refHigh?: number;
  critical?: number;
};

export const VITAL_SIGNS: readonly LabAnalyte[] = [
  { code: '8480-6', display: 'Systolic BP', unit: 'mmHg', refLow: 90, refHigh: 140 },
  { code: '8462-4', display: 'Diastolic BP', unit: 'mmHg', refLow: 60, refHigh: 90 },
  { code: '8867-4', display: 'Heart rate', unit: '/min', refLow: 60, refHigh: 100 },
  { code: '9279-1', display: 'Respiratory rate', unit: '/min', refLow: 12, refHigh: 20 },
  { code: '8310-5', display: 'Temperature', unit: 'Cel', refLow: 36.1, refHigh: 37.2 },
  { code: '2708-6', display: 'SpO2', unit: '%', refLow: 94, refHigh: 100 },
] as const;

export const ANTHROPOMETRICS: readonly LabAnalyte[] = [
  { code: '8302-2', display: 'Height', unit: 'cm' },
  { code: '29463-7', display: 'Body weight', unit: 'kg' },
  { code: '8280-0', display: 'Waist circumference', unit: 'cm' },
  { code: '39156-5', display: 'BMI', unit: 'kg/m2' },
] as const;

export type PocCodedTest = {
  code: string;
  display: string;
  type: 'coded';
  fieldKey: 'pregnancy';
  options: readonly string[];
  pregnancyOnly?: boolean;
};

export type PocQuantityTest = {
  code: string;
  display: string;
  type: 'quantity';
  fieldKey: 'glucose';
  unit: string;
  refLow?: number;
  refHigh?: number;
};

export type PocTest = PocCodedTest | PocQuantityTest;

export const POC_TESTS: readonly PocTest[] = [
  {
    code: '81025-3',
    display: 'Pregnancy test (hCG)',
    type: 'coded',
    fieldKey: 'pregnancy',
    options: ['Negative', 'Positive', 'Indeterminate'],
    pregnancyOnly: true,
  },
  {
    code: '2345-7',
    display: 'Blood glucose (POC)',
    type: 'quantity',
    fieldKey: 'glucose',
    unit: 'mg/dL',
    refLow: 70,
    refHigh: 140,
  },
] as const;

export const HEADER_LABS = {
  totalCholesterol: { code: '2093-3', display: 'Total cholesterol', unit: 'mg/dL', refLow: 0, refHigh: 200 },
  lipase: { code: '3040-3', display: 'Lipase', unit: 'U/L', refLow: 13, refHigh: 60, critical: 180 },
  alt: { code: '1742-6', display: 'ALT', unit: 'U/L', refLow: 7, refHigh: 56, critical: 168 },
  ast: { code: '1920-8', display: 'AST', unit: 'U/L', refLow: 10, refHigh: 40, critical: 120 },
  creatinine: { code: '2160-0', display: 'Creatinine', unit: 'µmol/L', refLow: 45, refHigh: 90, critical: 135 },
} as const;

export const LAB_PANELS = [
  {
    id: 'cbc',
    display: 'CBC',
    code: '58410-2',
    codingDisplay: 'Complete blood count panel',
    description: 'Haemoglobin, WBC, platelets, and red cell indices',
  },
  {
    id: 'ue',
    display: 'U&E',
    code: '24320-4',
    codingDisplay: 'Electrolytes panel',
    description: 'Sodium, potassium, urea, and creatinine',
  },
  {
    id: 'lft',
    display: 'LFT',
    code: '24325-3',
    codingDisplay: 'Hepatic function panel',
    description: 'ALT, AST, bilirubin, and albumin',
  },
  {
    id: 'lipase',
    display: 'Lipase',
    code: '3040-3',
    codingDisplay: 'Lipase',
    description: 'Pancreatic enzyme — GLP-1 safety monitoring',
  },
  {
    id: 'cholesterol',
    display: 'Lipid panel',
    code: '57698-3',
    codingDisplay: 'Lipid panel',
    description: 'Total cholesterol, LDL, HDL, and triglycerides',
  },
] as const;

export const CONSULT_SYMPTOMS = [
  { code: '422587007', display: 'Nausea' },
  { code: '422400008', display: 'Vomiting' },
  { code: '14760008', display: 'Constipation' },
  { code: '102832002', display: 'Epigastric pain' },
  { code: '21522001', display: 'Abdominal pain' },
  { code: '111516008', display: 'Blurred vision' },
  { code: '235719002', display: 'Cyclic vomiting syndrome' },
  { code: '88587001', display: 'Inability to pass flatus' },
  { code: '34095006', display: 'Dehydration' },
  { code: '62315008', display: 'Diarrhoea' },
  { code: '25064002', display: 'Headache' },
  { code: '84229001', display: 'Fatigue' },
  { code: '404640003', display: 'Dizziness' },
  { code: '18165001', display: 'Jaundice' },
] as const;

export const COMMON_DIAGNOSES = [
  { code: '414916001', display: 'Obesity' },
  { code: '44054006', display: 'Type 2 diabetes mellitus' },
  { code: '38341003', display: 'Hypertension' },
  { code: '13644009', display: 'Hypercholesterolaemia' },
  { code: '237602007', display: 'Metabolic syndrome' },
  { code: '235856003', display: 'Liver disease' },
  { code: '36358007', display: 'Pancreatitis' },
] as const;

export function analyteStatus(value: number, ref: LabAnalyte): 'normal' | 'warning' | 'critical' {
  if (ref.critical !== undefined && value >= ref.critical) return 'critical';
  if (ref.refHigh !== undefined && value > ref.refHigh) return 'warning';
  if (ref.refLow !== undefined && value < ref.refLow) return 'warning';
  return 'normal';
}

export function isConcerning(value: number | undefined, ref: LabAnalyte): boolean {
  if (value === undefined) return false;
  const s = analyteStatus(value, ref);
  return s === 'warning' || s === 'critical';
}
