const NEW_PATIENT_NOTICE = `We collect your name, age, contact details, and screening answers only for this visit.

If you pass GLP-1 pre-screening, reception may contact you to register and book care. If you do not pass, you may speak with reception about other options or leave without saving your details.`;

const RETURNING_NOTICE = `We use your name, date of birth, and symptom answers to match your record and alert clinic staff if needed.`;

export function PrivacyNotice({ variant = 'new' }: { variant?: 'new' | 'returning' }) {
  const text = variant === 'returning' ? RETURNING_NOTICE : NEW_PATIENT_NOTICE;
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50 p-4 text-[14px] text-ink-700 leading-relaxed">
      {text}
    </div>
  );
}
