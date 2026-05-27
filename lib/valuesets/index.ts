/**
 * Canonical ValueSet definitions for the GLP-1 / GIP safety monitor.
 *
 * Each entry is an ECL expression resolved against Snowstorm via
 * the SNOMED CT implicit value set mechanism.
 */

export const VALUE_SETS = {
  absoluteContraindications: {
    id: 'glp1-absolute-contraindications',
    title: 'GLP-1 absolute contraindications',
    ecl: '<< 255032005 |MEN-2| OR << 255075006 |Medullary thyroid carcinoma| OR << 75694006 |Acute pancreatitis|',
  },
  cautions: {
    id: 'glp1-cautions',
    title: 'GLP-1 cautions',
    ecl: '<< 235919008 |Cholelithiasis| OR << 4855003 |Diabetic retinopathy| OR << 235595009 |Gastroparesis| OR << 197321007 |Steatohepatitis|',
  },
  adverseEvents: {
    id: 'glp1-adverse-events',
    title: 'GLP-1 adverse events',
    ecl: '<< 422587007 |Nausea| OR << 422400008 |Vomiting| OR << 14760008 |Constipation| OR << 81060008 |Intestinal obstruction| OR 111360009 |Obstipation| OR << 102832002 |Epigastric pain| OR << 62315008 |Diarrhoea| OR << 95911005 |Injection site reaction|',
  },
  incretinAgents: {
    id: 'glp1-agents',
    title: 'Incretin therapy agents',
    ecl: '<< 414438008 |GLP-1 receptor agonist| OR << 1187428003 |Tirzepatide|',
  },
} as const;

type LabAnalyte = {
  code: string;
  display: string;
  unit: string;
  refLow?: number;
  refHigh?: number;
  critical?: number;
};

// LOINC-coded laboratory analytes used by the safety panel
export const SAFETY_LAB_PANEL: readonly LabAnalyte[] = [
  { code: '3040-3', display: 'Lipase', refLow: 13, refHigh: 60, unit: 'U/L', critical: 180 },
  { code: '1798-8', display: 'Amylase', refLow: 30, refHigh: 110, unit: 'U/L', critical: 330 },
  { code: '1742-6', display: 'ALT', refLow: 7, refHigh: 56, unit: 'U/L', critical: 168 },
  { code: '2160-0', display: 'Creatinine', refLow: 45, refHigh: 90, unit: 'umol/L' },
  { code: '4548-4', display: 'HbA1c', refLow: 4.0, refHigh: 6.0, unit: '%' },
  { code: '1989-3', display: 'Calcitonin', refLow: 0, refHigh: 10, unit: 'pg/mL', critical: 100 },
  { code: '3016-3', display: 'TSH', refLow: 0.4, refHigh: 4.0, unit: 'mIU/L' },
  { code: '29463-7', display: 'Body weight', unit: 'kg' },
  { code: '39156-5', display: 'BMI', unit: 'kg/m2' },
] as const;

export const PHQ9_LOINC = '44261-6';
