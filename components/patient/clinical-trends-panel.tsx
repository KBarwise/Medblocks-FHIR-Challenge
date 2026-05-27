'use client';

import { LabTrendsDashboard } from '@/components/trends/LabTrendsDashboard';
import { VitalsTrendsDashboard } from '@/components/trends/VitalsTrendsDashboard';

/** Dynamic FHIR Observation trend charts (vitals + labs). */
export function ClinicalTrendsPanel({ patientId }: { patientId: string }) {
  return (
    <>
      <VitalsTrendsDashboard patientId={patientId} />
      <LabTrendsDashboard patientId={patientId} />
    </>
  );
}
