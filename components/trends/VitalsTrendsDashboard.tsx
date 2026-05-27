'use client';

import { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/primitives';
import {
  VITAL_CHART_GROUPS,
  dateRangeBounds,
  type DateRangePreset,
} from '@/lib/clinical/trend-metrics';
import { DateRangePicker } from './DateRangePicker';
import { VitalChartCard } from './VitalChartCard';

export function VitalsTrendsDashboard({ patientId }: { patientId: string }) {
  const [range, setRange] = useState<DateRangePreset>('all');
  const [activeGroup, setActiveGroup] = useState(VITAL_CHART_GROUPS[0]!.id);
  const { dateFrom, dateTo } = useMemo(() => dateRangeBounds(range), [range]);

  const group = VITAL_CHART_GROUPS.find(g => g.id === activeGroup) ?? VITAL_CHART_GROUPS[0]!;

  return (
    <div id="vitals-signs-trends" className="space-y-4 mb-4 scroll-mt-24">
      <Card>
        <CardTitle icon={<Activity className="h-4 w-4" />}>Vital signs trends</CardTitle>
        <p className="text-[12px] text-ink-500 mb-3">
          Historical vitals from FHIR Observations — same view as OpenCare grouped charts.
        </p>
        <DateRangePicker value={range} onChange={setRange} />
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-1 p-3 border-b border-ink-100 bg-ink-50/50">
          {VITAL_CHART_GROUPS.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGroup(g.id)}
              className={`px-3 py-1.5 rounded-md text-[12px] border transition-colors ${
                activeGroup === g.id
                  ? 'bg-white border-ink-200 text-ink-900 font-medium shadow-sm'
                  : 'border-transparent text-ink-600 hover:bg-white/80'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          <VitalChartCard
            patientId={patientId}
            def={group}
            dateFrom={dateFrom}
            dateTo={dateTo}
            chartKey={`${group.id}-${range}`}
          />
        </div>
      </Card>
    </div>
  );
}
