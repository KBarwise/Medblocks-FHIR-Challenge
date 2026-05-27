'use client';

import { useClinic } from '@/components/clinic/clinic-context';
import { PatientNav } from '@/components/patient/patient-nav';

/** Nurse chart tabs below the patient banner. */
export function PatientChromeToolbar({ patientId }: { patientId: string }) {
  const { role } = useClinic();
  if (role !== 'nurse') return null;

  return (
    <div className="mt-2 pt-2 border-t border-ink-100/80">
      <PatientNav patientId={patientId} embedded toolbar />
    </div>
  );
}
