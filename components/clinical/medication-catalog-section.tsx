'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { inputClass, labelClass } from '@/components/clinical/form-styles';
import { MEDICATION_CATEGORIES } from '@/lib/clinical/medication-catalog';
import {
  defaultConsultMedication,
  defaultIntakeMedication,
  MEDICATION_CHANGE_OPTIONS,
  MEDICATION_PRIORITY_OPTIONS,
  type ConsultMedication,
  type MedicationChangeType,
  type MedicationPriority,
} from '@/lib/clinical/medication-qualifiers';

export function MedicationCatalogSection({
  medications,
  onMedicationsChange,
  existingMedCodes = new Set<string>(),
  collapsibleWhenEmpty = false,
  title = 'Current medications',
  description,
  intakeMode = false,
}: {
  medications: ConsultMedication[];
  onMedicationsChange: (next: ConsultMedication[]) => void;
  /** SNOMED codes already active on chart — used by doctor consult to block duplicate orders. */
  existingMedCodes?: Set<string>;
  collapsibleWhenEmpty?: boolean;
  title?: string;
  description?: string;
  /** Nurse intake: default new entries to Continue; collapsible when none listed. */
  intakeMode?: boolean;
}) {
  const [expanded, setExpanded] = useState(
    () => !collapsibleWhenEmpty || medications.length > 0,
  );

  const defaultMed = intakeMode ? defaultIntakeMedication : defaultConsultMedication;

  function toggleMedication(code: string) {
    const m = MEDICATION_CATEGORIES.flatMap(c => c.medications).find(x => x.code === code);
    if (!m) return;
    if (medications.some(rx => rx.code === code)) {
      onMedicationsChange(medications.filter(rx => rx.code !== code));
      return;
    }
    if (!intakeMode && existingMedCodes.has(code)) return;
    onMedicationsChange([...medications, defaultMed(m.code, m.display)]);
    if (collapsibleWhenEmpty) setExpanded(true);
  }

  function updateMedication(
    code: string,
    patch: Partial<Pick<ConsultMedication, 'changeType' | 'priority'>>,
  ) {
    onMedicationsChange(
      medications.map(rx => (rx.code === code ? { ...rx, ...patch } : rx)),
    );
  }

  const header = (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {collapsibleWhenEmpty && (
        <span className="text-[11px] text-ink-500">
          {medications.length === 0 ? 'None documented' : `${medications.length} listed`}
        </span>
      )}
    </div>
  );

  const body = (
    <div className="space-y-4">
      {description && <p className="text-[12px] text-ink-500">{description}</p>}
      {MEDICATION_CATEGORIES.filter(c => c.medications.length > 0).map(cat => (
        <div key={cat.id}>
          <p className="text-[12px] font-medium text-ink-600 mb-1.5">{cat.label}</p>
          <div className="flex flex-wrap gap-2">
            {cat.medications.map(m => {
              const selected = medications.some(rx => rx.code === m.code);
              const onChart = !intakeMode && existingMedCodes.has(m.code);
              return (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => toggleMedication(m.code)}
                  disabled={onChart && !selected}
                  title={onChart ? 'Already active on medication list' : undefined}
                  className={`px-2.5 py-1 rounded-md text-[12px] border ${
                    selected
                      ? 'bg-info-soft text-info border-info/30'
                      : onChart
                        ? 'bg-ink-50 border-ink-100 text-ink-400 cursor-not-allowed'
                        : 'bg-ink-50 border-ink-100 hover:border-ink-200'
                  }`}
                >
                  {m.display}
                  {onChart && !selected ? ' (on chart)' : ''}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {medications.length > 0 && (
        <ul className="space-y-3 border-t border-ink-100 pt-3">
          {medications.map(rx => (
            <li key={rx.code} className="rounded-md border border-ink-100 p-3 bg-ink-50/50">
              <div className="font-medium text-[13px] mb-2">{rx.display}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Therapy change</label>
                  <select
                    className={inputClass}
                    value={rx.changeType}
                    onChange={e =>
                      updateMedication(rx.code, {
                        changeType: e.target.value as MedicationChangeType,
                      })
                    }
                  >
                    {MEDICATION_CHANGE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    className={inputClass}
                    value={rx.priority}
                    onChange={e =>
                      updateMedication(rx.code, {
                        priority: e.target.value as MedicationPriority,
                      })
                    }
                  >
                    {MEDICATION_PRIORITY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {medications.length === 0 && !collapsibleWhenEmpty && (
        <p className="text-[12px] text-ink-500">No medications selected.</p>
      )}
    </div>
  );

  if (!collapsibleWhenEmpty) {
    return (
      <section className="border border-ink-100 rounded-lg p-4 bg-white space-y-3">
        {header}
        {body}
      </section>
    );
  }

  return (
    <section className="border border-ink-100 rounded-lg bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-ink-50/80"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-ink-500 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-ink-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">{header}</div>
      </button>
      {expanded && <div className="px-4 pb-4 border-t border-ink-100">{body}</div>}
    </section>
  );
}
