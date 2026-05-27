'use client';

import { useMemo, useState } from 'react';
import { toPoints } from '@/lib/clinical/observationToPoints';
import { useObservations } from '@/hooks/useObservations';
import type { VitalChartGroup } from '@/lib/clinical/trend-metrics';
import { FhirTrendChart } from './FhirTrendChart';
import type { ChartSeriesInput } from './chart-data';

const LOINC_ALIASES: Record<string, string[]> = {
  '2708-6': ['2708-6', '59408-5'],
  '8310-5': ['8310-5', '8331-1'],
};

function seriesPoints(
  allPoints: ReturnType<typeof toPoints>,
  seriesCode: string,
) {
  const codes = LOINC_ALIASES[seriesCode] ?? [seriesCode];
  return allPoints
    .filter(p => codes.includes(p.code))
    .map(p => ({ ...p, code: seriesCode }));
}

function ChartSkeleton() {
  return <div className="h-[320px] w-full rounded-md bg-ink-50 animate-pulse" />;
}

export function VitalChartCard({
  patientId,
  def,
  dateFrom,
  dateTo,
  chartKey,
}: {
  patientId: string;
  def: VitalChartGroup;
  dateFrom?: string;
  dateTo?: string;
  /** Changes when data loads — triggers chart enter animation */
  chartKey?: string;
}) {
  const [altUnit, setAltUnit] = useState(false);
  const targetUnit = altUnit && def.unitToggle ? def.unitToggle.targetUnit : def.targetUnit;
  const unitLabel =
    altUnit && def.unitToggle ? def.unitToggle.label : def.unitLabel;

  const { data, isLoading, isError, error, refetch } = useObservations({
    patientId,
    codes: def.codes,
    dateFrom,
    dateTo,
    pageSize: 500,
  });

  const series: ChartSeriesInput[] = useMemo(() => {
    const allPoints = toPoints(data ?? [], targetUnit);
    return def.series.map(s => ({
      ...s,
      points: seriesPoints(allPoints, s.code),
    }));
  }, [data, def.series, targetUnit]);

  const pointCount = series.reduce((n, s) => n + s.points.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        {def.unitToggle && (
          <button
            type="button"
            onClick={() => setAltUnit(v => !v)}
            className="text-[11px] px-2 py-0.5 rounded border border-ink-100 text-ink-600 hover:bg-ink-50 ml-auto"
          >
            {altUnit ? def.unitLabel : def.unitToggle.label}
          </button>
        )}
      </div>
      {isLoading && <ChartSkeleton />}
      {isError && (
        <div className="text-[12px] py-8 text-center space-y-2">
          <p style={{ color: 'hsl(var(--destructive))' }}>{error?.message ?? 'Failed to load'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 text-[12px] border border-ink-100 rounded-md hover:bg-ink-50"
          >
            Retry
          </button>
        </div>
      )}
      {!isLoading && !isError && (
        <FhirTrendChart
          key={chartKey ?? `${def.id}-${pointCount}`}
          series={series}
          unitLabel={unitLabel}
          showReferenceBand={false}
          height={320}
          showLegend
          criticalLine={def.criticalLine}
          animateOnMount
        />
      )}
    </div>
  );
}
