export type MedicationChangeType = 'start' | 'continue' | 'change' | 'refill';
export type MedicationPriority = 'routine' | 'urgent';

export const MEDICATION_CHANGE_OPTIONS: { value: MedicationChangeType; label: string }[] = [
  { value: 'start', label: 'Start (new)' },
  { value: 'continue', label: 'Continue' },
  { value: 'change', label: 'Change dose/agent' },
  { value: 'refill', label: 'Refill' },
];

export const MEDICATION_PRIORITY_OPTIONS: { value: MedicationPriority; label: string }[] = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
];

export type ConsultMedication = {
  code: string;
  display: string;
  changeType: MedicationChangeType;
  priority: MedicationPriority;
};

export function defaultConsultMedication(code: string, display: string): ConsultMedication {
  return {
    code,
    display,
    changeType: 'start',
    priority: 'routine',
  };
}

/** Nurse intake — medicines the patient is already taking. */
export function defaultIntakeMedication(code: string, display: string): ConsultMedication {
  return {
    code,
    display,
    changeType: 'continue',
    priority: 'routine',
  };
}

export function formatMedicationQualifiers(med: ConsultMedication): string {
  const c = MEDICATION_CHANGE_OPTIONS.find(o => o.value === med.changeType)?.label ?? med.changeType;
  const p = MEDICATION_PRIORITY_OPTIONS.find(o => o.value === med.priority)?.label ?? med.priority;
  return `${c} · ${p}`;
}
