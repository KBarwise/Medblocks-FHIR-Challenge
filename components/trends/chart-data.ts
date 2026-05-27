import type { TrendPoint } from '@/lib/clinical/observationToPoints';

export type ChartSeriesInput = {
  code: string;
  display: string;
  color: string;
  strokeDasharray?: string;
  points: TrendPoint[];
};

export type MergedChartRow = {
  t: number;
  [key: string]: number | TrendPoint | null | undefined;
};

export function mergeChartSeries(series: ChartSeriesInput[]): MergedChartRow[] {
  const byT = new Map<number, MergedChartRow>();

  for (const s of series) {
    for (const p of s.points) {
      if (p.value === null) continue;
      const row = byT.get(p.t) ?? { t: p.t };
      row[s.code] = p.value;
      row[`__meta_${s.code}`] = p;
      byT.set(p.t, row);
    }
  }

  return [...byT.values()].sort((a, b) => a.t - b.t);
}

export function referenceBandFromSeries(series: ChartSeriesInput[]): {
  refLow?: number;
  refHigh?: number;
} {
  if (series.length !== 1) return {};
  const pts = series[0]?.points ?? [];
  const withRef = pts.filter(p => p.refLow !== undefined || p.refHigh !== undefined);
  if (withRef.length === 0) return {};
  return {
    refLow: Math.min(...withRef.map(p => p.refLow ?? Infinity)),
    refHigh: Math.max(...withRef.map(p => p.refHigh ?? -Infinity)),
  };
}
