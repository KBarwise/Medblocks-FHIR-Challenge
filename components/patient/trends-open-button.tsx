'use client';

import { LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  trendsSectionToTab,
  type TrendsTabId,
} from '@/lib/clinical/trends-navigation';
import { usePatientTrendsOptional } from '@/components/patient/patient-trends-context';

export function TrendsOpenButton({
  tab,
  section,
  className,
  children,
}: {
  /** Direct tab when opening the overlay. */
  tab?: TrendsTabId;
  /** Legacy intake section id (maps to a tab). */
  section?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const trends = usePatientTrendsOptional();
  if (!trends) return null;

  const resolvedTab = tab ?? (section ? trendsSectionToTab(section) : undefined);

  return (
    <button
      type="button"
      onClick={() => trends.openTrends(resolvedTab)}
      className={cn(
        'inline-flex items-center gap-1 text-[11px] text-info hover:underline shrink-0',
        className,
      )}
    >
      <LineChart className="h-3 w-3" />
      {children ?? 'Trends'}
    </button>
  );
}

export function PatientNavTrendsButton({ className }: { className?: string }) {
  const trends = usePatientTrendsOptional();
  if (!trends) return null;

  return (
    <button
      type="button"
      onClick={() => trends.openTrends()}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-md border border-ink-200 bg-white text-ink-800 hover:bg-ink-50 shadow-sm',
        trends.isOpen && 'ring-2 ring-info/30 border-info/40',
        className,
      )}
    >
      <LineChart className="h-3.5 w-3.5" />
      Trends
    </button>
  );
}
