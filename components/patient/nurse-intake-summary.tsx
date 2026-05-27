import { Card, CardTitle } from '@/components/ui/primitives';
import {
  buildNurseIntakeSummary,
  nurseIntakeHasData,
  type NurseIntakeRow,
} from '@/lib/clinical/nurse-intake-summary';
import type { Observation } from '@/lib/fhir/resources';
import { Activity } from 'lucide-react';

function IntakeTable({ rows, emptyLabel }: { rows: NurseIntakeRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="text-[12px] text-ink-500 py-1">{emptyLabel}</p>;
  }
  return (
    <table className="w-full text-[13px]">
      <tbody>
        {rows.map(row => (
          <tr key={row.label} className="border-b border-ink-50 last:border-b-0">
            <td className="py-1.5 pr-3 text-ink-600 w-[40%]">{row.label}</td>
            <td className="py-1.5 font-medium tnum">
              <span
                className={
                  row.status === 'critical'
                    ? 'text-danger'
                    : row.status === 'warning'
                      ? 'text-warning'
                      : 'text-ink-900'
                }
              >
                {row.value}
                {row.unit ? ` ${row.unit}` : ''}
              </span>
            </td>
            <td className="py-1.5 pl-2 text-[11px] text-ink-400 text-right whitespace-nowrap">
              {row.date ?? ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function NurseIntakeSummary({ observations }: { observations: Observation[] }) {
  const summary = buildNurseIntakeSummary(observations);

  return (
    <Card className="mb-3">
      <CardTitle icon={<Activity className="h-4 w-4" />}>Nurse intake — today&apos;s measurements</CardTitle>
      {!nurseIntakeHasData(summary) ? (
        <p className="text-[13px] text-ink-500 py-2">
          No vital signs, anthropometrics, or point-of-care results recorded yet. Complete nurse
          documentation before the consultation.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-[12px] font-medium text-ink-600 mb-1.5">Vital signs</h4>
            <IntakeTable rows={summary.vitals} emptyLabel="No vitals recorded" />
          </div>
          <div>
            <h4 className="text-[12px] font-medium text-ink-600 mb-1.5">Anthropometrics</h4>
            <IntakeTable rows={summary.anthropometrics} emptyLabel="No height/weight/BMI recorded" />
          </div>
          <div>
            <h4 className="text-[12px] font-medium text-ink-600 mb-1.5">Point-of-care tests</h4>
            <IntakeTable rows={summary.poc} emptyLabel="No POC tests recorded" />
          </div>
          {summary.nursingNote && (
            <div>
              <h4 className="text-[12px] font-medium text-ink-600 mb-1.5">Nursing note</h4>
              <p className="text-[13px] text-ink-800 whitespace-pre-wrap">{summary.nursingNote.value}</p>
              {summary.nursingNote.date && (
                <p className="text-[11px] text-ink-400 mt-1">{summary.nursingNote.date}</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
