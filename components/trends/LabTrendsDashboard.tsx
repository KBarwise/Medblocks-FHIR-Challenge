'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/primitives';
import { pointsForCodes, toPoints, type TrendPoint } from '@/lib/clinical/observationToPoints';
import { CHART_COLORS, COLOR_DESTRUCTIVE } from '@/lib/clinical/trend-chart-tokens';
import {
  DEFAULT_LAB_SELECTION,
  PRIORITY_LAB_CODES,
  dateRangeBounds,
  type DateRangePreset,
} from '@/lib/clinical/trend-metrics';
import { useLabCodeCatalog, useObservations } from '@/hooks/useObservations';
import { DateRangePicker } from './DateRangePicker';
import { FhirTrendChart } from './FhirTrendChart';
import type { ChartSeriesInput } from './chart-data';

function trendArrow(points: TrendPoint[]): { symbol: string; destructive: boolean } {
  const inRange = points.filter(p => p.value !== null && !p.outOfRange);
  const latest = points[points.length - 1];
  const destructive = Boolean(latest?.outOfRange);
  if (inRange.length < 2) return { symbol: '→', destructive };
  const a = inRange[inRange.length - 2]!.value!;
  const b = inRange[inRange.length - 1]!.value!;
  if (b > a) return { symbol: '↑', destructive };
  if (b < a) return { symbol: '↓', destructive };
  return { symbol: '→', destructive };
}

function exportCsv(series: ChartSeriesInput[], filename: string) {
  const rows: string[] = ['date,code,display,value,unit,refLow,refHigh,interpretation,outOfRange,observationId'];
  for (const s of series) {
    for (const p of s.points) {
      if (p.value === null) continue;
      rows.push(
        [
          format(p.t, "yyyy-MM-dd'T'HH:mm:ss"),
          p.code,
          `"${p.display.replace(/"/g, '""')}"`,
          p.value,
          p.unit,
          p.refLow ?? '',
          p.refHigh ?? '',
          p.interpretation ?? '',
          p.outOfRange,
          p.observationId,
        ].join(','),
      );
    }
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function LabTrendsDashboard({ patientId }: { patientId: string }) {
  const [range, setRange] = useState<DateRangePreset>('all');
  const { dateFrom, dateTo } = useMemo(() => dateRangeBounds(range), [range]);
  const catalog = useLabCodeCatalog(patientId, dateFrom, dateTo);

  const codeOptions = useMemo(() => {
    const fromCatalog = catalog.data ?? [];
    if (fromCatalog.length > 0) return fromCatalog;
    return PRIORITY_LAB_CODES.map(l => ({ code: l.code, display: l.display }));
  }, [catalog.data]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(DEFAULT_LAB_SELECTION),
  );

  const selectedCodes = [...selected];
  const codesFilter = selectedCodes.map(code => ({
    system: 'http://loinc.org' as const,
    code,
  }));

  const { data, isLoading, isError, error, refetch } = useObservations({
    patientId,
    codes: codesFilter.length ? codesFilter : undefined,
    dateFrom,
    dateTo,
    pageSize: 500,
    enabled: selectedCodes.length > 0,
  });

  const series: ChartSeriesInput[] = useMemo(() => {
    const allPoints = toPoints(data ?? []);
    return selectedCodes.map((code, i) => {
      const opt = codeOptions.find(c => c.code === code);
      return {
        code,
        display: opt?.display ?? code,
        color: CHART_COLORS[i % CHART_COLORS.length]!,
        points: pointsForCodes(allPoints, [code]),
      };
    });
  }, [data, selectedCodes, codeOptions]);

  function toggleCode(code: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <div className="space-y-4 mb-4">
      <Card>
        <CardTitle icon={<Activity className="h-4 w-4" />}>Laboratory trends</CardTitle>
        <p className="text-[12px] text-ink-500 mb-3">
          HbA1c, BMI, cholesterol, and other lab results over time (FHIR category laboratory).
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <DateRangePicker value={range} onChange={setRange} />
          <button
            type="button"
            disabled={series.every(s => s.points.length === 0)}
            onClick={() => exportCsv(series, `labs-${patientId}-${range}.csv`)}
            className="px-3 py-1.5 text-[12px] border border-ink-100 rounded-md hover:bg-ink-50 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        <div className="text-[11px] font-medium text-ink-600 mb-1.5">Measures</div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto">
          {codeOptions.map(c => {
            const on = selected.has(c.code);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => toggleCode(c.code)}
                className={`px-2 py-1 rounded-md text-[11px] border transition-colors ${
                  on
                    ? 'bg-info-soft text-info border-info/30'
                    : 'bg-ink-50 border-ink-100 text-ink-600 hover:border-ink-200'
                }`}
              >
                {c.display}
              </button>
            );
          })}
        </div>

        {selectedCodes.length > 0 && (
          <ul className="flex flex-wrap gap-3 mt-3 text-[12px]">
            {series.map(s => {
              const arrow = trendArrow(s.points);
              return (
                <li key={s.code} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.display}</span>
                  <span
                    className={`tnum font-medium ${arrow.destructive ? 'text-danger' : 'text-ink-600'}`}
                    style={arrow.destructive ? { color: COLOR_DESTRUCTIVE } : undefined}
                  >
                    {arrow.symbol}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        {selectedCodes.length === 0 && (
          <p className="text-[12px] text-ink-500 py-6 text-center">Select at least one lab measure.</p>
        )}
        {selectedCodes.length > 0 && isLoading && (
          <div className="h-[280px] w-full rounded-md bg-ink-50 animate-pulse" />
        )}
        {selectedCodes.length > 0 && isError && (
          <div className="text-[12px] py-8 text-center space-y-2">
            <p className="text-danger">{error?.message ?? 'Failed to load'}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1.5 text-[12px] border border-ink-100 rounded-md hover:bg-ink-50"
            >
              Retry
            </button>
          </div>
        )}
        {selectedCodes.length > 0 && !isLoading && !isError && (
          <FhirTrendChart
            key={`lab-${range}-${selectedCodes.join(',')}`}
            series={series}
            unitLabel={selectedCodes.length === 1 ? (series[0]?.points[0]?.unit ?? '') : 'mixed'}
            showReferenceBand={selectedCodes.length === 1}
            height={320}
            showLegend
            animateOnMount
          />
        )}
      </Card>
    </div>
  );
}
