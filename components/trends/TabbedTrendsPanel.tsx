'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/primitives';
import { FlaskConical, HeartPulse } from 'lucide-react';
import {
  DEFAULT_VITAL_TREND_SELECTION,
  VITAL_TREND_OPTIONS,
} from '@/lib/clinical/trend-code-sets';
import { DEFAULT_LAB_SELECTION, PRIORITY_LAB_CODES } from '@/lib/clinical/trend-metrics';
import { tabFromTrendsParam, type TrendsTabId } from '@/lib/clinical/trends-navigation';
import { useLabCodeCatalog } from '@/hooks/useObservations';
import { MeasureTrendsTab } from './MeasureTrendsTab';

export type { TrendsTabId };

const TABS: Array<{ id: TrendsTabId; label: string; icon: typeof HeartPulse }> = [
  { id: 'vitals', label: 'Vital signs', icon: HeartPulse },
  { id: 'laboratory', label: 'Laboratory tests', icon: FlaskConical },
];

function LaboratoryTrendsTabContent({
  patientId,
  labOptions,
}: {
  patientId: string;
  labOptions: Array<{ code: string; display: string }>;
}) {
  const defaultSelected = useMemo(() => {
    const preferred = DEFAULT_LAB_SELECTION.filter(code => labOptions.some(o => o.code === code));
    if (preferred.length > 0) return preferred;
    return labOptions.slice(0, 2).map(o => o.code);
  }, [labOptions]);

  return (
    <MeasureTrendsTab
      patientId={patientId}
      codeOptions={labOptions}
      defaultSelected={defaultSelected}
      exportPrefix="labs"
      emptyMessage="Select at least one laboratory test."
    />
  );
}

export function TabbedTrendsPanel({
  patientId,
  activeTab: controlledTab,
  onTabChange,
}: {
  patientId: string;
  activeTab?: TrendsTabId;
  onTabChange?: (tab: TrendsTabId) => void;
}) {
  const searchParams = useSearchParams();
  const urlTab = tabFromTrendsParam(searchParams.get('tab'));
  const [uncontrolledTab, setUncontrolledTab] = useState<TrendsTabId>(urlTab);

  const isControlled = controlledTab !== undefined && onTabChange !== undefined;
  const activeTab = isControlled ? controlledTab : uncontrolledTab;

  useEffect(() => {
    if (isControlled) return;
    setUncontrolledTab(urlTab);
  }, [isControlled, urlTab]);

  function selectTab(tab: TrendsTabId) {
    if (isControlled) onTabChange!(tab);
    else setUncontrolledTab(tab);
  }

  const labCatalog = useLabCodeCatalog(patientId);
  const labOptions = useMemo(() => {
    const fromCatalog = labCatalog.data ?? [];
    if (fromCatalog.length > 0) return fromCatalog;
    return PRIORITY_LAB_CODES.map(l => ({ code: l.code, display: l.display }));
  }, [labCatalog.data]);

  const activeMeta = TABS.find(t => t.id === activeTab) ?? TABS[0]!;
  const TabIcon = activeMeta.icon;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-ink-100 bg-ink-50/60">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const on = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] border transition-colors ${
                on
                  ? 'bg-white border-ink-200 text-ink-900 font-medium shadow-sm'
                  : 'border-transparent text-ink-600 hover:bg-white/80'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        <CardTitle icon={<TabIcon className="h-4 w-4" />}>{activeMeta.label}</CardTitle>
        <p className="text-[12px] text-ink-500 mb-4">
          {activeTab === 'vitals' && 'Select vital signs and anthropometrics to compare over time.'}
          {activeTab === 'laboratory' && 'Select laboratory analytes (HbA1c, lipids, liver and renal tests, etc.).'}
        </p>

        {activeTab === 'vitals' && (
          <MeasureTrendsTab
            patientId={patientId}
            codeOptions={VITAL_TREND_OPTIONS}
            defaultSelected={DEFAULT_VITAL_TREND_SELECTION}
            exportPrefix="vitals"
            emptyMessage="Select at least one vital sign or anthropometric measure."
          />
        )}

        {activeTab === 'laboratory' && (
          <LaboratoryTrendsTabContent patientId={patientId} labOptions={labOptions} />
        )}
      </div>
    </Card>
  );
}
