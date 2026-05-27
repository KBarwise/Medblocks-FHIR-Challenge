import type { Patient } from './resources';
import { fullName } from '@/lib/utils';

export type DuplicateGroup = {
  key: string;
  patients: Patient[];
  reason: string;
};

export function patientSummary(p: Patient): string {
  const name = fullName(p);
  const id = p.identifier?.[0]?.value;
  return id ? `${name} · MRN ${id}` : name;
}
