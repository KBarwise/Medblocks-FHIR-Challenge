'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COLOR_DESTRUCTIVE, COLOR_PRIMARY } from '@/lib/clinical/trend-chart-tokens';
import { CustomDot } from './CustomDot';
import { TrendTooltip } from './TrendTooltip';
import {
  mergeChartSeries,
  referenceBandFromSeries,
  type ChartSeriesInput,
} from './chart-data';

export function FhirTrendChart({
  series,
  unitLabel,
  showReferenceBand = true,
  height = 280,
  showLegend = false,
  criticalLine,
  animateOnMount = false,
}: {
  series: ChartSeriesInput[];
  unitLabel: string;
  showReferenceBand?: boolean;
  height?: number;
  showLegend?: boolean;
  criticalLine?: { y: number; label: string };
  animateOnMount?: boolean;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mounted, setMounted] = useState(!animateOnMount);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!animateOnMount || reduceMotion) {
      setMounted(true);
      return;
    }
    setMounted(false);
    const t = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(t);
  }, [animateOnMount, reduceMotion, series]);

  const data = useMemo(() => mergeChartSeries(series), [series]);
  const singleSeries = series.length === 1;
  const { refLow, refHigh } = referenceBandFromSeries(series);
  const showBand =
    showReferenceBand
    && singleSeries
    && refLow !== undefined
    && refHigh !== undefined
    && Number.isFinite(refLow)
    && Number.isFinite(refHigh);

  const hasValues = data.length > 0;
  const animate = mounted && !reduceMotion;

  const tickFormat = (t: number) => {
    const span =
      data.length >= 2
        ? Math.abs(data[data.length - 1]!.t - data[0]!.t)
        : 0;
    if (span > 1000 * 60 * 60 * 24 * 60) return format(t, 'MMM yyyy');
    if (span > 1000 * 60 * 60 * 24 * 2) return format(t, 'MMM d');
    return format(t, 'MMM d, HH:mm');
  };

  return (
    <div style={{ width: '100%', height }} className="min-w-0">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={hasValues ? data : [{ t: Date.now() }]}
          margin={{ top: 12, right: 16, left: 8, bottom: showLegend ? 8 : 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={hasValues ? ['dataMin', 'dataMax'] : ['auto', 'auto']}
            tickFormatter={tickFormat}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--chart-grid))' }}
          />
          <YAxis
            domain={hasValues ? ['auto', 'auto'] : [0, 1]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          {showBand && (
            <>
              <ReferenceArea
                y1={refLow}
                y2={refHigh}
                fill={COLOR_PRIMARY}
                fillOpacity={0.1}
                ifOverflow="extendDomain"
              />
              <ReferenceLine
                y={refLow}
                stroke={COLOR_PRIMARY}
                strokeDasharray="4 4"
                strokeOpacity={0.45}
              />
              <ReferenceLine
                y={refHigh}
                stroke={COLOR_PRIMARY}
                strokeDasharray="4 4"
                strokeOpacity={0.45}
              />
            </>
          )}
          {criticalLine && (
            <ReferenceLine
              y={criticalLine.y}
              stroke={COLOR_DESTRUCTIVE}
              strokeDasharray="6 4"
              strokeOpacity={0.7}
              label={{
                value: criticalLine.label,
                position: 'insideTopRight',
                fill: COLOR_DESTRUCTIVE,
                fontSize: 10,
              }}
            />
          )}
          {series.map(s => (
            <Line
              key={s.code}
              type="monotone"
              dataKey={s.code}
              name={s.display}
              stroke={s.color}
              strokeWidth={2.5}
              strokeDasharray={s.strokeDasharray}
              connectNulls
              isAnimationActive={animate}
              animationDuration={1200}
              animationEasing="ease-out"
              dot={<CustomDot />}
              activeDot={{ r: 7, strokeWidth: 0 }}
            />
          ))}
          {hasValues && data.length > 3 && (
            <Brush
              dataKey="t"
              height={28}
              travellerWidth={10}
              tickFormatter={tickFormat}
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--chart-grid))"
              fillOpacity={0.25}
            />
          )}
          <Tooltip content={<TrendTooltip series={series} unitLabel={unitLabel} />} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="plainline"
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {!hasValues && (
        <p
          className="text-center text-[12px] -mt-[calc(50%-12px)] pointer-events-none"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          No results in selected range
        </p>
      )}
    </div>
  );
}
