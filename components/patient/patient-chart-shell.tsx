'use client';

import { Suspense, type ReactNode } from 'react';
import { PatientTrendsProvider } from '@/components/patient/patient-trends-context';
import { ClinicalTrendsOverlay } from '@/components/patient/clinical-trends-overlay';

export function PatientChartShell({
  patientId,
  children,
}: {
  patientId: string;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={children}>
      <PatientTrendsProvider patientId={patientId}>
        {children}
        <Suspense fallback={null}>
          <ClinicalTrendsOverlay />
        </Suspense>
      </PatientTrendsProvider>
    </Suspense>
  );
}
