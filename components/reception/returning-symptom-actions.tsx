'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { scheduleKioskSymptomDoctorFollowUp } from '@/app/(app)/scheduling/actions';
import { receptionBookPatientUrl } from '@/lib/clinic/access';

export function ReturningSymptomActions({
  reportId,
  patientId,
  patientName,
}: {
  reportId: string;
  patientId: string;
  patientName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const bookHref = receptionBookPatientUrl(patientId, patientName, {
    clinicRole: 'doctor',
    symptomReportId: reportId,
  });

  function queueForDoctor() {
    startTransition(async () => {
      try {
        await scheduleKioskSymptomDoctorFollowUp({
          reportId,
          patientId,
          patientName,
        });
        router.refresh();
      } catch (err) {
        window.alert((err as Error).message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={queueForDoctor}
        className="text-[12px] px-2.5 py-1 rounded bg-ink-900 text-white hover:bg-ink-700 disabled:opacity-50 whitespace-nowrap"
      >
        {pending ? 'Queuing…' : 'Queue for doctor'}
      </button>
      <Link href={bookHref} className="text-info text-[12px] hover:underline">
        Book appointment…
      </Link>
    </div>
  );
}
