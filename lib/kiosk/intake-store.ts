import type { KioskIntakeLead } from './intake-types';

const leads = new Map<string, KioskIntakeLead>();

export function saveKioskIntakeLead(lead: KioskIntakeLead): void {
  leads.set(lead.id, lead);
}

export function getKioskIntakeLead(id: string): KioskIntakeLead | undefined {
  return leads.get(id);
}

export function listPendingKioskIntakes(): KioskIntakeLead[] {
  return [...leads.values()]
    .filter(l => l.status === 'pending-registration')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markKioskIntakeRegistered(id: string, patientId: string): void {
  const lead = leads.get(id);
  if (!lead) return;
  leads.set(id, {
    ...lead,
    status: 'registered',
    registeredPatientId: patientId,
  });
}
