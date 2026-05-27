'use client';

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { DEFAULT_LAB_SELECTION } from '@/lib/clinical/trend-metrics';
import { useLabCodeCatalog } from '@/hooks/useObservations';
import { MeasureTrendsDashboard } from './MeasureTrendsDashboard';

export function LabTrendsDashboard({ patientId }: { patientId: string }) {
  const catalog = useLabCodeCatalog(patientId);
  const codeOptions = useMemo(() => {
    const fromCatalog = catalog.data ?? [];
    return fromCatalog.length > 0 ? fromCatalog : [];
  }, [catalog.data]);

  return (
    <MeasureTrendsDashboard
      patientId={patientId}
      sectionId="laboratory-trends"
      title="Laboratory trends"
      description="HbA1c, lipids, liver enzymes, renal function, and other laboratory results over time."
      icon={<Activity className="h-4 w-4" />}
      codeOptions={codeOptions}
      defaultSelected={DEFAULT_LAB_SELECTION}
      exportPrefix="labs"
      emptyMessage="Select at least one laboratory measure."
    />
  );
}
