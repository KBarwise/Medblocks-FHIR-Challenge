import type { LabAnalyte } from './lab-catalog';
import { HEADER_LABS, LAB_PANELS } from './lab-catalog';

export type PanelAnalyte = LabAnalyte & {
  panelId: (typeof LAB_PANELS)[number]['id'];
  synonyms: string[];
};

/** Analytes expected from imported lab PDFs, grouped by panel. */
export const PANEL_ANALYTES: readonly PanelAnalyte[] = [
  // CBC
  { panelId: 'cbc', code: '718-7', display: 'Haemoglobin', unit: 'g/dL', refLow: 12, refHigh: 16, synonyms: ['haemoglobin', 'hemoglobin', 'hgb', 'hb'] },
  { panelId: 'cbc', code: '4544-3', display: 'Haematocrit', unit: '%', refLow: 36, refHigh: 46, synonyms: ['haematocrit', 'hematocrit', 'hct'] },
  { panelId: 'cbc', code: '6690-2', display: 'WBC', unit: '10*3/uL', refLow: 4, refHigh: 11, synonyms: ['wbc', 'white blood cell', 'leukocyte'] },
  { panelId: 'cbc', code: '777-3', display: 'Platelets', unit: '10*3/uL', refLow: 150, refHigh: 400, synonyms: ['platelet', 'plt'] },
  { panelId: 'cbc', code: '789-8', display: 'RBC', unit: '10*6/uL', refLow: 4, refHigh: 5.5, synonyms: ['rbc', 'red blood cell', 'erythrocyte'] },
  // U&E
  { panelId: 'ue', code: '2951-2', display: 'Sodium', unit: 'mmol/L', refLow: 136, refHigh: 145, synonyms: ['sodium', 'na'] },
  { panelId: 'ue', code: '2823-3', display: 'Potassium', unit: 'mmol/L', refLow: 3.5, refHigh: 5.1, synonyms: ['potassium', 'k'] },
  { panelId: 'ue', code: '2075-0', display: 'Chloride', unit: 'mmol/L', refLow: 98, refHigh: 107, synonyms: ['chloride', 'cl'] },
  { panelId: 'ue', code: '2160-0', display: 'Creatinine', unit: 'umol/L', refLow: 45, refHigh: 90, synonyms: ['creatinine', 'creat'] },
  { panelId: 'ue', code: '3094-0', display: 'Urea', unit: 'mmol/L', refLow: 2.5, refHigh: 7.8, synonyms: ['urea', 'bun', 'blood urea nitrogen'] },
  // LFT
  { panelId: 'lft', ...HEADER_LABS.alt, synonyms: ['alt', 'alanine aminotransferase', 'sgpt'] },
  { panelId: 'lft', ...HEADER_LABS.ast, synonyms: ['ast', 'aspartate aminotransferase', 'sgot'] },
  { panelId: 'lft', code: '6768-6', display: 'ALP', unit: 'U/L', refLow: 44, refHigh: 147, synonyms: ['alp', 'alkaline phosphatase'] },
  { panelId: 'lft', code: '1975-2', display: 'Bilirubin total', unit: 'mg/dL', refLow: 0.1, refHigh: 1.2, synonyms: ['bilirubin', 'total bilirubin'] },
  { panelId: 'lft', code: '1751-7', display: 'Albumin', unit: 'g/L', refLow: 35, refHigh: 50, synonyms: ['albumin'] },
  // Lipid / cholesterol
  { panelId: 'cholesterol', ...HEADER_LABS.totalCholesterol, synonyms: ['total cholesterol', 'cholesterol total', 'chol'] },
  { panelId: 'cholesterol', code: '13457-7', display: 'LDL cholesterol', unit: 'mg/dL', refLow: 0, refHigh: 100, synonyms: ['ldl', 'ldl cholesterol'] },
  { panelId: 'cholesterol', code: '2085-9', display: 'HDL cholesterol', unit: 'mg/dL', refLow: 40, refHigh: 200, synonyms: ['hdl', 'hdl cholesterol'] },
  { panelId: 'cholesterol', code: '2571-8', display: 'Triglycerides', unit: 'mg/dL', refLow: 0, refHigh: 150, synonyms: ['triglyceride', 'tg'] },
  // Lipase
  { panelId: 'lipase', ...HEADER_LABS.lipase, synonyms: ['lipase'] },
];

export function panelLabel(panelId: PanelAnalyte['panelId']): string {
  return LAB_PANELS.find(p => p.id === panelId)?.display ?? panelId;
}
