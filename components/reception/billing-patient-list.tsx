import Link from 'next/link';
import { Badge } from '@/components/ui/primitives';
import { formatTime } from '@/lib/clinical/scheduling';
import { WORKFLOW_LABELS } from '@/lib/clinical/workflow';
import type { AppointmentRow } from '@/lib/fhir/appointments';

export function BillingPatientList({ rows }: { rows: AppointmentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-ink-500 py-4">
        No patients awaiting billing for this day.
      </p>
    );
  }

  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="text-left text-xs text-ink-500 border-b border-ink-100">
          <th className="py-2 font-medium">Time</th>
          <th className="py-2 font-medium">Patient</th>
          <th className="py-2 font-medium">Visit</th>
          <th className="py-2 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr
            key={row.appointment.id}
            className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50"
          >
            <td className="py-2.5 font-mono text-[12px]">
              {formatTime(row.appointment.start)}
            </td>
            <td className="py-2.5">
              {row.patientId ? (
                <Link
                  href={`/register/${row.patientId}`}
                  className="font-medium hover:text-info"
                >
                  {row.patientName}
                </Link>
              ) : (
                <span className="font-medium">{row.patientName}</span>
              )}
            </td>
            <td className="py-2.5 text-ink-500">
              {row.clinicRole === 'doctor' ? 'Doctor consultation' : 'Clinic visit'}
            </td>
            <td className="py-2.5">
              <Badge tone="warning">{WORKFLOW_LABELS[row.workflow]}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
