'use client';

import { useState, useTransition } from 'react';
import { lookupReturningPatient, submitReturningPatientSymptoms } from './actions';
import { PrivacyNotice } from '@/components/kiosk/privacy-notice';
import { KIOSK_RETURNING_WARNING_SYMPTOMS } from '@/lib/kiosk/returning-symptoms';
import {
  KIOSK_RETURNING_CLEAR_THANK_YOU,
  KIOSK_RETURNING_NOT_FOUND,
  KIOSK_RETURNING_URGENT_THANK_YOU,
  KIOSK_THANK_YOU_HEADLINE,
} from '@/lib/kiosk/messages';
import { AlertOctagon, CheckCircle2, UserRound } from 'lucide-react';

type Step = 'identify' | 'consent' | 'symptoms' | 'done';

const inputClass =
  'w-full px-4 py-3 border border-ink-100 rounded-xl bg-white text-[16px] focus:outline-none focus:ring-2 focus:ring-accent/30';
const labelClass = 'block text-[13px] text-ink-500 mb-1.5';

export function KioskReturningFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('identify');
  const [given, setGiven] = useState('');
  const [family, setFamily] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [consented, setConsented] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [urgent, setUrgent] = useState(false);

  const stepIndex = ['identify', 'consent', 'symptoms'].indexOf(step);

  function toggleSymptom(code: string) {
    setSelectedCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );
  }

  function goNext() {
    setError(null);
    if (step === 'identify') {
      if (!given.trim() || !family.trim() || !birthDate) {
        setError('Please enter your first name, last name, and date of birth.');
        return;
      }
      startTransition(async () => {
        const r = await lookupReturningPatient({ given, family, birthDate });
        if ('error' in r) {
          setError(KIOSK_RETURNING_NOT_FOUND);
          return;
        }
        setPatientId(r.patientId);
        setPatientName(r.patientName);
        setStep('consent');
      });
      return;
    }
    if (step === 'consent') {
      if (!consented) {
        setError('Please read the notice and check the box to continue.');
        return;
      }
      setStep('symptoms');
      return;
    }
    if (step === 'symptoms') {
      startTransition(async () => {
        try {
          const r = await submitReturningPatientSymptoms({
            patientId,
            patientName,
            birthDate,
            symptomCodes: selectedCodes,
            consented: true,
          });
          setUrgent(r.urgent);
          setStep('done');
        } catch (e) {
          setError((e as Error).message);
        }
      });
    }
  }

  function goBack() {
    setError(null);
    if (step === 'consent') setStep('identify');
    else if (step === 'symptoms') setStep('consent');
    else onBack();
  }

  if (step === 'done') {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div
          className={`p-6 rounded-xl border text-center ${
            urgent ? 'bg-danger-soft border-danger/30' : 'bg-accent-soft border-accent/30'
          }`}
        >
          {urgent ? (
            <AlertOctagon className="h-12 w-12 text-danger mx-auto mb-3" />
          ) : (
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3" />
          )}
          <h3 className="text-xl font-medium mb-2">{KIOSK_THANK_YOU_HEADLINE}</h3>
          <p className="text-[15px] text-ink-700 leading-relaxed">
            {urgent ? KIOSK_RETURNING_URGENT_THANK_YOU : KIOSK_RETURNING_CLEAR_THANK_YOU}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-info-soft text-info mb-3">
          <UserRound className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-medium mb-2">Symptom check</h2>
        <p className="text-[15px] text-ink-500">
          Step {stepIndex + 1} of 3 —{' '}
          {step === 'identify'
            ? 'Sign in'
            : step === 'consent'
              ? 'Privacy & consent'
              : 'How are you feeling?'}
        </p>
      </div>

      {step === 'identify' && (
        <div className="space-y-4 bg-white border border-ink-100 rounded-xl p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name</label>
              <input
                className={inputClass}
                value={given}
                onChange={e => setGiven(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                className={inputClass}
                value={family}
                onChange={e => setFamily(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Date of birth</label>
            <input
              type="date"
              className={inputClass}
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              autoComplete="bday"
            />
          </div>
        </div>
      )}

      {step === 'consent' && (
        <div className="space-y-4">
          <p className="text-[14px] text-ink-600 text-center">
            Signed in as <strong>{patientName}</strong>
          </p>
          <PrivacyNotice variant="returning" />
          <label className="flex items-start gap-3 p-4 bg-white border border-ink-100 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={consented}
              onChange={e => {
                setConsented(e.target.checked);
                setError(null);
              }}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span className="text-[14px] text-ink-700 leading-snug">
              I consent to this symptom check and understand staff may be alerted if I report
              urgent symptoms.
            </span>
          </label>
        </div>
      )}

      {step === 'symptoms' && (
        <div className="space-y-3 bg-white border border-ink-100 rounded-xl p-5">
          <p className="text-[14px] text-ink-700 leading-relaxed">
            Tap <strong>Yes</strong> for anything you are experiencing <strong>today</strong>.
            Tap again to change your answer. If none apply, continue without selecting any.
          </p>
          <ul className="space-y-2">
            {KIOSK_RETURNING_WARNING_SYMPTOMS.map(s => {
              const selected = selectedCodes.includes(s.code);
              return (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => toggleSymptom(s.code)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-[14px] border transition-colors ${
                      selected
                        ? 'bg-danger-soft text-danger border-danger/30'
                        : 'bg-ink-50 border-ink-100 hover:border-ink-200 text-ink-800'
                    }`}
                  >
                    <span className="font-medium block">
                      {selected ? 'Yes — ' : ''}
                      {s.question}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && (
        <p className="text-[14px] text-danger mt-4 text-center" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-between gap-3 mt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={pending}
          className="px-5 py-3 text-[14px] border border-ink-100 rounded-xl bg-white disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={pending}
          className="px-6 py-3 text-[14px] bg-ink-900 text-white rounded-xl hover:bg-ink-700 disabled:opacity-50"
        >
          {pending ? 'Please wait…' : step === 'symptoms' ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
