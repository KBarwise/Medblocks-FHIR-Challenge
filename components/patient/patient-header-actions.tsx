'use client';

import { useClinic } from '@/components/clinic/clinic-context';
import { PatientNavTrendsButton } from '@/components/patient/trends-open-button';

export function PatientHeaderActions() {
  const { role } = useClinic();
  if (role !== 'nurse' && role !== 'doctor') return null;
  return <PatientNavTrendsButton />;
}
