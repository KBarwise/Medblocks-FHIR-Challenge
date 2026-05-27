/** Warning symptoms for returning patients at the kiosk (SNOMED CT). */

export type ReturningWarningSymptom = {
  code: string;
  display: string;
  /** Plain-language yes/no question */
  question: string;
};

export const KIOSK_RETURNING_WARNING_SYMPTOMS: readonly ReturningWarningSymptom[] = [
  {
    code: '21522001',
    display: 'Abdominal pain',
    question: 'Do you have severe pain in your stomach or upper belly?',
  },
  {
    code: '111516008',
    display: 'Blurred vision',
    question: 'Is your vision very blurry?',
  },
  {
    code: '235719002',
    display: 'Cyclic vomiting syndrome',
    question:
      'Are you vomiting over and over in cycles (sick, feel a little better, then vomit again)?',
  },
  {
    code: '18165001',
    display: 'Jaundice',
    question:
      'Have you noticed yellowing of your skin or the whites of your eyes?',
  },
  {
    code: '88587001',
    display: 'Inability to pass flatus',
    question: 'Have you been unable to pass gas?',
  },
  {
    code: '34095006',
    display: 'Dehydration',
    question:
      'Do you feel severely dehydrated (for example very dizzy, hardly urinating, or a very dry mouth)?',
  },
  {
    code: '14760008',
    display: 'Constipation',
    question:
      'Do you have severe constipation (no bowel movement for several days, with pain or vomiting)?',
  },
] as const;
