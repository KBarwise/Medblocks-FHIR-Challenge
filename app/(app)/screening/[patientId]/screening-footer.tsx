'use client';

import Link from 'next/link';
import { useClinic } from '@/components/clinic/clinic-context';

export function ScreeningFooter({ patientId }: { patientId: string }) {
  const { role } = useClinic();

  if (role === 'patient') {
    return (
      <div className="mt-8 p-5 rounded-xl bg-white border border-ink-100 text-center">
        <p className="text-[15px] text-ink-700">
          Thank you for your submission. When you are finished, please return to the reception desk.
        </p>
      </div>
    );
  }

  return (
    <p className="text-[12px] text-ink-500 mt-4">
      <Link href={`/patient/${patientId}`} className="text-info hover:underline">
        ← Back to patient dashboard
      </Link>
      {' · '}
      <Link href={`/prescribe/${patientId}`} className="text-info hover:underline">
        Prescribe →
      </Link>
    </p>
  );
}
