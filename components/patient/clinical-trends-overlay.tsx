'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { usePatientTrends } from '@/components/patient/patient-trends-context';
import { TabbedTrendsPanel } from '@/components/trends/TabbedTrendsPanel';

export function ClinicalTrendsOverlay() {
  const { patientId, isOpen, tab, closeTrends, setTrendsTab } = usePatientTrends();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeTrends();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeTrends]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-trends-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/45"
        aria-label="Close trends"
        onClick={closeTrends}
      />
      <div className="relative flex flex-col w-full sm:max-w-6xl max-h-[92vh] sm:max-h-[88vh] bg-[var(--bg)] rounded-t-2xl sm:rounded-xl shadow-2xl border border-ink-100 overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ink-100 bg-ink-50/80 shrink-0">
          <div>
            <h2 id="patient-trends-title" className="text-[15px] font-medium text-ink-900">
              Trends
            </h2>
            <p className="text-[12px] text-ink-500">
              Compare vital signs and laboratory results over time.
            </p>
          </div>
          <button
            type="button"
            onClick={closeTrends}
            className="p-2 rounded-md border border-ink-100 text-ink-600 hover:bg-white hover:text-ink-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="overflow-y-auto flex-1 p-4">
          <TabbedTrendsPanel
            patientId={patientId}
            activeTab={tab}
            onTabChange={setTrendsTab}
          />
        </div>
      </div>
    </div>
  );
}
