'use client';

import { AnthropometricsTrendsDashboard } from '@/components/trends/AnthropometricsTrendsDashboard';
import { LabTrendsDashboard } from '@/components/trends/LabTrendsDashboard';
import { VitalsTrendsDashboard } from '@/components/trends/VitalsTrendsDashboard';

/** FHIR Observation trend charts — vitals, anthropometrics, and laboratory. */
export function ClinicalTrendsPanel({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-8">
      <VitalsTrendsDashboard patientId={patientId} />
      <AnthropometricsTrendsDashboard patientId={patientId} />
      <LabTrendsDashboard patientId={patientId} />
    </div>
  );
}
