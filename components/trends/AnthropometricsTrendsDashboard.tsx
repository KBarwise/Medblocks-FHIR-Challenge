'use client';

import { useMemo } from 'react';
import { Ruler } from 'lucide-react';
import { DEFAULT_ANTHROPOMETRIC_SELECTION } from '@/lib/clinical/trend-metrics';
import { useAnthropometricCodeCatalog } from '@/hooks/useObservations';
import { MeasureTrendsDashboard } from './MeasureTrendsDashboard';

export function AnthropometricsTrendsDashboard({ patientId }: { patientId: string }) {
  const catalog = useAnthropometricCodeCatalog(patientId);
  const codeOptions = useMemo(() => catalog.data ?? [], [catalog.data]);

  return (
    <MeasureTrendsDashboard
      patientId={patientId}
      sectionId="anthropometrics-trends"
      title="Anthropometrics trends"
      description="BMI, weight, height, and waist circumference over time."
      icon={<Ruler className="h-4 w-4" />}
      codeOptions={codeOptions}
      defaultSelected={DEFAULT_ANTHROPOMETRIC_SELECTION}
      exportPrefix="anthropometrics"
      emptyMessage="Select at least one anthropometric measure."
    />
  );
}
