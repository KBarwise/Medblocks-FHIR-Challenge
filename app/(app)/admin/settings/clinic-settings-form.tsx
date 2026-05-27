'use client';

import { useClinic } from '@/components/clinic/clinic-context';
import { useEffect, useState, useTransition } from 'react';
import { saveClinicName } from './actions';

export function ClinicSettingsForm() {
  const { clinicName, setClinicName } = useClinic();
  const [draft, setDraft] = useState(clinicName);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(clinicName);
  }, [clinicName]);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await saveClinicName(draft);
        setClinicName(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSave} className="space-y-3 text-[13px]">
      <div>
        <label className="block text-xs text-ink-500 mb-1.5">Clinic display name</label>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="w-full px-3 py-2 border border-ink-100 rounded-md"
          placeholder="e.g. Riverside Metabolic Clinic"
          required
          disabled={pending}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-ink-900 text-white text-[12px] rounded-md hover:bg-ink-700 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save clinic name'}
      </button>
      {saved && (
        <p className="text-[12px] text-accent">
          Saved — the name is stored for this browser and survives refresh.
        </p>
      )}
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </form>
  );
}
