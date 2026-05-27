'use client';

import { format } from 'date-fns';
import { COLOR_DESTRUCTIVE, COLOR_MUTED } from '@/lib/clinical/trend-chart-tokens';
import type { TrendPoint } from '@/lib/clinical/observationToPoints';
import type { ChartSeriesInput } from './chart-data';

export function TrendTooltip({
  active,
  payload,
  label,
  series,
  unitLabel,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: number;
  series: ChartSeriesInput[];
  unitLabel: string;
}) {
  if (!active || !payload?.length || label === undefined) return null;

  const t = typeof label === 'number' ? label : Number(label);

  return (
    <div className="rounded-md border border-ink-100 bg-white px-3 py-2 text-[12px] shadow-lg max-w-xs">
      <div className="font-medium mb-1.5">{format(t, 'PPp')}</div>
      <ul className="space-y-1">
        {series.map(s => {
          const row = payload.find(p => p.dataKey === s.code);
          const meta = row?.payload?.[`__meta_${s.code}`] as TrendPoint | undefined;
          const value = row?.value ?? meta?.value;
          if (value === undefined || value === null) return null;
          const out = meta?.outOfRange;
          return (
            <li key={s.code} className="flex items-start gap-2">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: out ? COLOR_DESTRUCTIVE : s.color }}
              />
              <span>
                <span className="font-medium">{s.display}: </span>
                <span className="tnum" style={{ color: out ? COLOR_DESTRUCTIVE : undefined }}>
                  {value} {unitLabel}
                </span>
                {meta?.interpretation && (
                  <span className="text-ink-500"> · {meta.interpretation}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {(() => {
        const firstMeta = series
          .map(s => payload[0]?.payload?.[`__meta_${s.code}`])
          .find(Boolean) as TrendPoint | undefined;
        if (!firstMeta?.performer) return null;
        return (
          <p className="mt-1.5 text-[11px]" style={{ color: COLOR_MUTED }}>
            {firstMeta.performer}
          </p>
        );
      })()}
    </div>
  );
}
