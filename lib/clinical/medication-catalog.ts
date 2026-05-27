/** SNOMED CT medication concepts for consult prescribing (non-exhaustive common agents). */

export type MedicationCatalogEntry = {
  code: string;
  display: string;
  defaultDoseText: string;
  routeCode?: string;
  routeDisplay?: string;
};

export type MedicationCategory = {
  id: string;
  label: string;
  medications: MedicationCatalogEntry[];
};

export const MEDICATION_CATEGORIES: MedicationCategory[] = [
  {
    id: 'incretin',
    label: 'GLP-1 / GIP therapy',
    medications: [], // handled separately with dose boxes
  },
  {
    id: 'antihypertensive',
    label: 'Blood pressure',
    medications: [
      { code: '386873009', display: 'Lisinopril', defaultDoseText: '10 mg orally once daily' },
      { code: '386864001', display: 'Amlodipine', defaultDoseText: '5 mg orally once daily' },
      { code: '9638002', display: 'Losartan', defaultDoseText: '50 mg orally once daily' },
      { code: '372756006', display: 'Hydrochlorothiazide', defaultDoseText: '12.5 mg orally once daily' },
      { code: '372833009', display: 'Metoprolol', defaultDoseText: '50 mg orally once daily' },
    ],
  },
  {
    id: 'antihyperglycemic',
    label: 'Diabetes (non-GLP-1)',
    medications: [
      { code: '372567009', display: 'Metformin', defaultDoseText: '500 mg orally twice daily with meals' },
      { code: '593611000', display: 'Sitagliptin (Januvia)', defaultDoseText: '100 mg orally once daily' },
      { code: '412210009', display: 'Empagliflozin', defaultDoseText: '10 mg orally once daily' },
      { code: '412451003', display: 'Glipizide', defaultDoseText: '5 mg orally once daily before breakfast' },
    ],
  },
  {
    id: 'statin',
    label: 'Statins',
    medications: [
      { code: '387517004', display: 'Atorvastatin', defaultDoseText: '20 mg orally once daily at night' },
      { code: '387584000', display: 'Simvastatin', defaultDoseText: '20 mg orally once daily at night' },
      { code: '387406002', display: 'Rosuvastatin', defaultDoseText: '10 mg orally once daily' },
    ],
  },
  {
    id: 'common',
    label: 'Common medicines',
    medications: [
      { code: '387458008', display: 'Aspirin', defaultDoseText: '81 mg orally once daily' },
      { code: '387220006', display: 'Ibuprofen', defaultDoseText: '400 mg orally every 6 hours as needed' },
      { code: '372733004', display: 'Ferrous sulfate (iron)', defaultDoseText: '325 mg orally once daily' },
      { code: '387207008', display: 'Paracetamol', defaultDoseText: '500 mg orally every 6 hours as needed' },
    ],
  },
  {
    id: 'herbal',
    label: 'Herbal / complementary',
    medications: [
      { code: '412439001', display: 'Herbal medicine (general)', defaultDoseText: 'As directed on product label' },
      { code: '412441000', display: 'St John\'s wort', defaultDoseText: 'As directed — check interactions' },
      { code: '412442007', display: 'Garlic supplement', defaultDoseText: 'As directed on product label' },
      { code: '412444008', display: 'Omega-3 fish oil', defaultDoseText: 'As directed on product label' },
    ],
  },
];

const byCode = new Map<string, MedicationCatalogEntry>();
for (const cat of MEDICATION_CATEGORIES) {
  for (const m of cat.medications) {
    byCode.set(m.code, m);
  }
}

export function getCatalogMedication(code: string): MedicationCatalogEntry | undefined {
  return byCode.get(code);
}

export function allCatalogMedicationCodes(): string[] {
  return [...byCode.keys()];
}
