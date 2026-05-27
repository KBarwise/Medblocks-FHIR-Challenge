'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Pill } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/primitives';
import type { MedicationRequest } from '@/lib/fhir/resources';
import { medicationQualifierSummary, medicationRequestLabel, medicationSnomedCode } from '@/lib/clinical/medications';

export function PatientMedicationsList({ medications }: { medications: MedicationRequest[] }) {
  const [expanded, setExpanded] = useState(medications.length > 0);

  const header = (
    <CardTitle icon={<Pill className="h-4 w-4" />}>
      Current medications
      {medications.length === 0 && (
        <span className="ml-2 text-[11px] font-normal text-ink-500">None on record</span>
      )}
    </CardTitle>
  );

  if (medications.length === 0) {
    return (
      <Card className="mb-3 overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-2 text-left -m-1 p-1 rounded hover:bg-ink-50/80"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-ink-500 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-ink-500 shrink-0" />
          )}
          <span className="flex-1">{header}</span>
        </button>
        {expanded && (
          <p className="text-[13px] text-ink-500 py-2 pl-6">No active medications on record.</p>
        )}
      </Card>
    );
  }

  return (
    <Card className="mb-0 h-full">
      {header}
      <ul className="text-[13px] space-y-2">
        {medications.map(mr => {
          const qualifiers = medicationQualifierSummary(mr);
          return (
            <li
              key={mr.id ?? medicationSnomedCode(mr) ?? medicationRequestLabel(mr)}
              className="text-ink-800 border-b border-ink-50 last:border-0 pb-2 last:pb-0"
            >
              <div>{medicationRequestLabel(mr)}</div>
              {qualifiers && (
                <div className="text-[11px] text-ink-500 mt-0.5">{qualifiers}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
