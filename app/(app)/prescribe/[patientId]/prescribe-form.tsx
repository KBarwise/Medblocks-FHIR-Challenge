'use client';

import { useState, useTransition } from 'react';
import { submitPrescription } from './actions';
import { DoseSelector } from '@/components/clinical/dose-selector';
import { CONSULT_AGENTS } from '@/lib/clinical/consult-chart';

export function PrescribeForm({ patientId }: { patientId: string }) {
  const [agentCode, setAgentCode] = useState<string>(CONSULT_AGENTS[0].code);
  const [doseIndex, setDoseIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const agent = CONSULT_AGENTS.find(a => a.code === agentCode)!;
  const dose = agent.doses[doseIndex];

  function onSubmit() {
    setResult(null);
    startTransition(async () => {
      try {
        const r = await submitPrescription({
          patientId,
          agentCode,
          agentDisplay: agent.display,
          doseValue: parseFloat(dose),
          doseUnit: 'mg',
        });
        setResult({ ok: true, message: `Created MedicationRequest/${r.id ?? 'unknown'}` });
      } catch (e) {
        setResult({ ok: false, message: (e as Error).message });
      }
    });
  }

  return (
    <div className="space-y-4 text-[13px]">
      <div>
        <label className="block text-xs text-ink-500 mb-1.5">Agent</label>
        <select
          value={agentCode}
          onChange={e => { setAgentCode(e.target.value); setDoseIndex(0); }}
          className="w-full px-3 py-2 border border-ink-100 rounded-md bg-white"
        >
          {CONSULT_AGENTS.map(a => (
            <option key={a.code} value={a.code}>{a.display}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-ink-500 mb-2">Weekly dose (titration step)</label>
        <DoseSelector
          doses={agent.doses}
          selectedIndex={doseIndex}
          onSelect={setDoseIndex}
        />
      </div>

      <div className="bg-info-soft text-info p-3 rounded-md text-[12px]">
        <div className="font-medium mb-0.5">Titration guidance</div>
        Start at the lowest dose for 4 weeks, then escalate per tolerability. Do not increase if GI adverse effects ≥ grade 2.
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSubmit}
          disabled={pending}
          className="px-4 py-2 bg-ink-900 text-white text-[12px] rounded-md hover:bg-ink-700 disabled:opacity-50"
        >
          {pending ? 'Submitting…' : 'Create MedicationRequest'}
        </button>
      </div>

      {result && (
        <div className={`p-3 rounded-md text-[12px] ${result.ok ? 'bg-accent-soft text-accent' : 'bg-danger-soft text-danger'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
