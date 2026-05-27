import type { KioskIntakeLead } from './intake-types';
import {
  fhirGetKioskIntakeLead,
  fhirListPendingKioskIntakes,
  fhirMarkKioskIntakeRegistered,
  fhirSaveKioskIntakeLead,
} from './fhir-kiosk-store';

export async function saveKioskIntakeLead(lead: KioskIntakeLead): Promise<void> {
  await fhirSaveKioskIntakeLead(lead);
}

export async function getKioskIntakeLead(id: string): Promise<KioskIntakeLead | undefined> {
  return fhirGetKioskIntakeLead(id);
}

export async function listPendingKioskIntakes(): Promise<KioskIntakeLead[]> {
  return fhirListPendingKioskIntakes();
}

export async function markKioskIntakeRegistered(id: string, patientId: string): Promise<void> {
  await fhirMarkKioskIntakeRegistered(id, patientId);
}
