import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricDelta } from '@/lib/clinical/observations';

export function MetabolicStat({
  label,
  metric,
  formatValue,
  invertDelta = false,
  className,
}: {
  label: string;
  metric: MetricDelta;
  formatValue: (v: number) => string;
  /** When true, a decrease is favourable (e.g. weight loss, HbA1c). */
  invertDelta?: boolean;
  className?: string;
}) {
  const { current, delta, pctChange, unit, date } = metric;

  let arrow: 'up' | 'down' | 'flat' = 'flat';
  let favourable = true;
  if (delta !== undefined) {
    if (delta > 0) arrow = 'up';
    else if (delta < 0) arrow = 'down';
    const signed = invertDelta ? -delta : delta;
    favourable = signed <= 0;
  }

  const ArrowIcon = arrow === 'up' ? ArrowUp : arrow === 'down' ? ArrowDown : Minus;
  const arrowClass =
    arrow === 'flat'
      ? 'text-ink-400'
      : favourable
        ? 'text-accent'
        : 'text-danger';

  return (
    <div className={cn('bg-ink-50 rounded-md px-3 py-2 min-w-0', className)}>
      <div className="text-[10px] uppercase tracking-wide text-ink-500 mb-1">{label}</div>
      <div className="flex items-end gap-1.5">
        <span className="text-lg font-medium tnum text-ink-900">
          {current !== undefined ? formatValue(current) : '–'}
        </span>
        {unit && current !== undefined && (
          <span className="text-[11px] text-ink-500 pb-0.5">{unit}</span>
        )}
      </div>
      <div className={cn('flex items-center gap-1 mt-1 text-[11px] tnum', arrowClass)}>
        <ArrowIcon className="h-3 w-3 shrink-0" />
        {delta !== undefined ? (
          <span>
            {invertDelta && delta < 0 ? '−' : delta > 0 ? '+' : ''}
            {invertDelta ? formatValue(Math.abs(delta)) : formatValue(delta)}
            {pctChange !== undefined && (
              <span className="text-ink-500 ml-1">
                ({pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%)
              </span>
            )}
          </span>
        ) : (
          <span className="text-ink-400">no prior</span>
        )}
      </div>
      {date && <div className="text-[10px] text-ink-400 mt-0.5">{date}</div>}
    </div>
  );
}
