import type { MedicationRequest } from '@/lib/fhir/resources';
import {
  MEDICATION_CHANGE_OPTIONS,
  MEDICATION_PRIORITY_OPTIONS,
  type ConsultMedication,
  type MedicationChangeType,
  type MedicationPriority,
} from './medication-qualifiers';

export function medicationRequestLabel(mr: MedicationRequest): string {
  const med =
    mr.medicationCodeableConcept?.text
    ?? mr.medicationCodeableConcept?.coding?.[0]?.display
    ?? 'Medication';
  const dose = mr.dosageInstruction?.[0]?.text;
  return dose ? `${med} — ${dose}` : med;
}

export function medicationSnomedCode(mr: MedicationRequest): string | undefined {
  return mr.medicationCodeableConcept?.coding?.find(c => c.system?.includes('snomed.info/sct'))?.code
    ?? mr.medicationCodeableConcept?.coding?.[0]?.code;
}

export function isActiveMedicationRequest(mr: MedicationRequest): boolean {
  return mr.status === 'active' || mr.status === 'on-hold';
}

const CHANGE_PREFIX = 'Therapy change: ';
const PRIORITY_PREFIX = 'Priority: ';

/** Parse qualifiers stored on MedicationRequest note lines at authoring time. */
export function medicationQualifierSummary(mr: MedicationRequest): string | null {
  const parts: string[] = [];
  const changeNote = mr.note?.find(n => n.text?.startsWith(CHANGE_PREFIX))?.text?.slice(CHANGE_PREFIX.length);
  const priorityNote = mr.note?.find(n => n.text?.startsWith(PRIORITY_PREFIX))?.text?.slice(PRIORITY_PREFIX.length);
  if (changeNote) {
    const match = MEDICATION_CHANGE_OPTIONS.find(o => o.label === changeNote || o.value === changeNote);
    parts.push(match?.label ?? changeNote);
  }
  if (priorityNote) {
    const match = MEDICATION_PRIORITY_OPTIONS.find(o => o.label === priorityNote || o.value === priorityNote);
    parts.push(match?.label ?? priorityNote);
  }
  if (parts.length > 0) return parts.join(' · ');
  if (mr.priority === 'urgent') return 'Urgent';
  return null;
}

export function activeMedicationSnomedCodes(requests: MedicationRequest[]): Set<string> {
  const codes = new Set<string>();
  for (const mr of requests) {
    if (!isActiveMedicationRequest(mr)) continue;
    const code = medicationSnomedCode(mr);
    if (code) codes.add(code);
  }
  return codes;
}

/** One entry per SNOMED medication code — prefer most recently authored. */
export function dedupeMedicationRequestsBySnomedCode(
  requests: MedicationRequest[],
): MedicationRequest[] {
  const byCode = new Map<string, MedicationRequest>();
  for (const mr of requests) {
    const code = medicationSnomedCode(mr);
    if (!code) continue;
    const existing = byCode.get(code);
    if (!existing || (mr.authoredOn ?? '') > (existing.authoredOn ?? '')) {
      byCode.set(code, mr);
    }
  }
  return [...byCode.values()].sort((a, b) =>
    medicationRequestLabel(a).localeCompare(medicationRequestLabel(b)),
  );
}

function parseChangeTypeFromRequest(mr: MedicationRequest): MedicationChangeType | undefined {
  const changeNote = mr.note?.find(n => n.text?.startsWith(CHANGE_PREFIX))?.text?.slice(CHANGE_PREFIX.length);
  if (!changeNote) return undefined;
  return MEDICATION_CHANGE_OPTIONS.find(o => o.label === changeNote || o.value === changeNote)?.value;
}

function parsePriorityFromRequest(mr: MedicationRequest): MedicationPriority | undefined {
  const priorityNote = mr.note?.find(n => n.text?.startsWith(PRIORITY_PREFIX))?.text?.slice(PRIORITY_PREFIX.length);
  if (priorityNote) {
    const match = MEDICATION_PRIORITY_OPTIONS.find(o => o.label === priorityNote || o.value === priorityNote);
    if (match) return match.value;
  }
  if (mr.priority === 'urgent') return 'urgent';
  return undefined;
}

export function consultMedicationFromRequest(mr: MedicationRequest): ConsultMedication | null {
  const code = medicationSnomedCode(mr);
  if (!code) return null;
  const display =
    mr.medicationCodeableConcept?.text
    ?? mr.medicationCodeableConcept?.coding?.[0]?.display
    ?? code;
  return {
    code,
    display,
    changeType: parseChangeTypeFromRequest(mr) ?? 'continue',
    priority: parsePriorityFromRequest(mr) ?? 'routine',
  };
}

export function consultMedicationsFromRequests(requests: MedicationRequest[]): ConsultMedication[] {
  return dedupeMedicationRequestsBySnomedCode(requests)
    .map(consultMedicationFromRequest)
    .filter((m): m is ConsultMedication => m !== null);
}

export function medicationQualifierNotes(args: {
  changeType: MedicationChangeType;
  priority: MedicationPriority;
}): Array<{ text: string }> {
  const changeLabel = MEDICATION_CHANGE_OPTIONS.find(o => o.value === args.changeType)?.label ?? args.changeType;
  const priorityLabel = MEDICATION_PRIORITY_OPTIONS.find(o => o.value === args.priority)?.label ?? args.priority;
  return [
    { text: `${CHANGE_PREFIX}${changeLabel}` },
    { text: `${PRIORITY_PREFIX}${priorityLabel}` },
  ];
}
