'use client';

import {
  DATE_RANGE_PRESETS,
  type DateRangePreset,
} from '@/lib/clinical/trend-metrics';

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Date range">
      {DATE_RANGE_PRESETS.map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className={`px-2 py-1 rounded-md text-[11px] border transition-colors ${
            value === p.id
              ? 'bg-info-soft text-info border-info/30'
              : 'bg-ink-50 border-ink-100 text-ink-600 hover:border-ink-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
