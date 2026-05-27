'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { bookAppointment } from '@/app/(app)/scheduling/actions';
import type { ClinicRole } from '@/lib/clinical/scheduling';
import { CLINIC_ROLES } from '@/lib/clinical/scheduling';

type PatientHit = { id: string; name: string; mrn?: string };

export function BookAppointmentForm({
  defaultDate,
  initialPatient,
  afterBookPath = '/reception/book',
}: {
  defaultDate: string;
  initialPatient?: PatientHit;
  /** Path to return to after a successful booking (date query appended). */
  afterBookPath?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PatientHit[]>([]);
  const [selected, setSelected] = useState<PatientHit | null>(initialPatient ?? null);
  const [clinicRole, setClinicRole] = useState<ClinicRole>('nurse');
  const [start, setStart] = useState(`${defaultDate}T09:00`);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialPatient?.id) return;
    setSelected(initialPatient);
    setQuery('');
    setHits([]);
  }, [initialPatient?.id, initialPatient?.name]);

  async function searchPatients(q: string) {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    setHits((data.patients ?? []).map((p: PatientHit) => p));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected?.id) {
      setError('Select a patient from search results');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await bookAppointment({
          patientId: selected.id,
          patientName: selected.name,
          clinicRole,
          start: new Date(start).toISOString(),
        });
        setQuery('');
        setSelected(null);
        setHits([]);
        router.replace(`${afterBookPath}?date=${defaultDate}`);
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-[13px]">
      <div>
        <label className="block text-xs text-ink-500 mb-1">Patient (search)</label>
        <input
          type="search"
          value={selected ? selected.name : query}
          onChange={e => {
            setSelected(null);
            setQuery(e.target.value);
            void searchPatients(e.target.value);
          }}
          placeholder="Name or MRN (min 2 chars)"
          className="w-full px-3 py-2 border border-ink-100 rounded-md"
        />
        {!selected && hits.length > 0 && (
          <ul className="mt-1 border border-ink-100 rounded-md max-h-32 overflow-auto">
            {hits.map(h => (
              <li key={h.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-ink-50"
                  onClick={() => {
                    setSelected(h);
                    setHits([]);
                  }}
                >
                  {h.name}
                  {h.mrn && <span className="text-ink-500"> · {h.mrn}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selected && (
          <button type="button" className="text-[12px] text-ink-500 mt-1" onClick={() => setSelected(null)}>
            Change patient
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-500 mb-1">Clinic</label>
          <select
            value={clinicRole}
            onChange={e => setClinicRole(e.target.value as ClinicRole)}
            className="w-full px-3 py-2 border border-ink-100 rounded-md"
          >
            <option value="nurse">{CLINIC_ROLES.nurse.display}</option>
            <option value="doctor">{CLINIC_ROLES.doctor.display}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-500 mb-1">Date & time</label>
          <input
            type="datetime-local"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="w-full px-3 py-2 border border-ink-100 rounded-md"
            required
          />
        </div>
      </div>
      {error && <p className="text-danger text-[12px]">{error}</p>}
      <button
        type="submit"
        disabled={pending || !selected}
        className="px-4 py-2 text-[12px] bg-ink-900 text-white rounded-md hover:bg-ink-700 disabled:opacity-50"
      >
        {pending ? 'Booking…' : 'Book appointment'}
      </button>
    </form>
  );
}
