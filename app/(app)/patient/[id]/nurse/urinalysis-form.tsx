'use client';

import { inputClass, labelClass } from '@/components/clinical/form-styles';
import {
  URINALYSIS_POC,
  urinalysisNormalValues,
} from '@/lib/clinical/urinalysis-poc';

export function UrinalysisForm({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  function setField(loinc: string, value: string) {
    onChange({ ...values, [loinc]: value });
  }

  function fillNormal() {
    onChange({ ...values, ...urinalysisNormalValues() });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-ink-500">
          Enter each dipstick result. Values are stored as separate observations on the FHIR server.
        </p>
        <button
          type="button"
          onClick={fillNormal}
          className="px-3 py-1.5 text-[12px] border border-ink-100 rounded-md bg-white hover:bg-ink-50 shrink-0"
        >
          Fill normal values
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {URINALYSIS_POC.map(field => (
          <div key={field.loinc}>
            <label className={labelClass}>{field.display}</label>
            {field.kind === 'select' && field.options ? (
              <select
                className={inputClass}
                value={values[field.loinc] ?? ''}
                onChange={e => setField(field.loinc, e.target.value)}
              >
                <option value="">—</option>
                {field.options.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className={inputClass}
                placeholder={field.placeholder ?? field.normal}
                value={values[field.loinc] ?? ''}
                onChange={e => setField(field.loinc, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
