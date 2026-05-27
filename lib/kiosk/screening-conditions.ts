/** Kiosk pre-screening — yes to any item is an exclusion until reviewed in clinic. */
export type KioskScreeningCondition = {
  code: string;
  /** Clinical label stored with screening results */
  display: string;
  /** Plain-language question shown on the kiosk */
  question: string;
};

export const KIOSK_SCREENING_CONDITIONS: readonly KioskScreeningCondition[] = [
  {
    code: '255032005',
    display: 'Multiple endocrine neoplasia type 2 (MEN 2)',
    question:
      'Do you have MEN 2, or does anyone in your close family (parent, brother, sister, or child)?',
  },
  {
    code: '255075006',
    display: 'Medullary thyroid carcinoma',
    question:
      'Have you ever been diagnosed with medullary thyroid cancer, or has a close family member had it?',
  },
  {
    code: '444561001',
    display: 'Planned surgery, anaesthetic, or dental procedure',
    question:
      'Do you have surgery, a general anaesthetic, sedation for a procedure, or dental treatment planned soon?',
  },
  {
    code: '77386006',
    display: 'Pregnancy',
    question: 'Are you pregnant now, trying to become pregnant, or could you be pregnant?',
  },
  {
    code: '414438008',
    display: 'Allergy to GLP-1 receptor agonist',
    question:
      'Have you ever had an allergic reaction to a GLP-1 injection medicine (such as semaglutide, liraglutide, tirzepatide, or dulaglutide — e.g. Ozempic, Wegovy, Saxenda, Mounjaro)?',
  },
] as const;
