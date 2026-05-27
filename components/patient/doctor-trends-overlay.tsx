'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ClinicalTrendsPanel } from '@/components/patient/clinical-trends-panel';
import { X } from 'lucide-react';

function titleForSection(section: string | null): string {
  if (!section) return 'Clinical trends';
  if (section.includes('vital')) return 'Vital signs trends';
  if (section.includes('anthropometric')) return 'Anthropometric trends';
  if (section.includes('laboratory')) return 'Laboratory trends';
  return 'Clinical trends';
}

export function DoctorTrendsOverlay({ patientId }: { patientId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const section = searchParams.get('trends');

  const isOpen = Boolean(section);
  const heading = useMemo(() => titleForSection(section), [section]);

  function closeOverlay() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('trends');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35 p-4 sm:p-6">
      <div className="mx-auto h-full max-w-6xl rounded-lg border border-ink-100 bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-medium">{heading}</h2>
          <button
            type="button"
            onClick={closeOverlay}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-100 px-2.5 py-1 text-[12px] hover:bg-ink-50"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <ClinicalTrendsPanel patientId={patientId} />
        </div>
      </div>
    </div>
  );
}
