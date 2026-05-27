import type { Appointment } from '@/lib/fhir/resources';

export const WORKFLOW_EXTENSION_URL = 'http://glp1-monitor.local/StructureDefinition/visit-workflow';

/** Visit pipeline stage (stored on Appointment.extension). */
export type VisitWorkflow =
  | 'scheduled'
  | 'waiting-nurse'
  | 'nurse-in-progress'
  | 'ready-for-doctor'
  | 'doctor-in-progress'
  | 'return-nurse'
  | 'ready-checkout'
  | 'completed';

export const WORKFLOW_LABELS: Record<VisitWorkflow, string> = {
  scheduled: 'Scheduled',
  'waiting-nurse': 'Waiting for nurse',
  'nurse-in-progress': 'With nurse',
  'ready-for-doctor': 'Ready for doctor',
  'doctor-in-progress': 'With doctor',
  'return-nurse': 'Return to nurse',
  'ready-checkout': 'Ready for checkout (reception)',
  completed: 'Completed',
};

export function workflowFromAppointment(a: Appointment): VisitWorkflow {
  const ext = a.extension?.find(e => e.url === WORKFLOW_EXTENSION_URL);
  const code = ext?.valueCode as VisitWorkflow | undefined;
  if (code && code in WORKFLOW_LABELS) return code;
  if (a.status === 'fulfilled') return 'completed';
  if (a.status === 'arrived') return 'waiting-nurse';
  return 'scheduled';
}

export function withWorkflow(a: Appointment, workflow: VisitWorkflow): Appointment {
  const rest = (a.extension ?? []).filter(e => e.url !== WORKFLOW_EXTENSION_URL);
  return {
    ...a,
    extension: [...rest, { url: WORKFLOW_EXTENSION_URL, valueCode: workflow }],
  };
}

export function workflowForNurseQueue(): VisitWorkflow[] {
  return ['waiting-nurse', 'nurse-in-progress', 'return-nurse'];
}

export function workflowForDoctorQueue(): VisitWorkflow[] {
  return ['ready-for-doctor', 'doctor-in-progress'];
}

export function workflowForReceptionCheckout(): VisitWorkflow[] {
  return ['ready-checkout', 'return-nurse'];
}

/** Patients who completed the doctor visit and need payment at reception. */
export function workflowForBilling(): VisitWorkflow[] {
  return ['ready-checkout'];
}
