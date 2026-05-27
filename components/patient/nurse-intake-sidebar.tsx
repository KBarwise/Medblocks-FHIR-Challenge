import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/primitives';
import {
  buildNurseIntakeSummary,
  nurseIntakeHasData,
  type NurseIntakeRow,
} from '@/lib/clinical/nurse-intake-summary';
import type { Observation } from '@/lib/fhir/resources';
import { Activity, LineChart } from 'lucide-react';

function trendsHref(patientId: string, section: string): string {
  const q = new URLSearchParams({ trends: section });
  return `/patient/${patientId}/consult/document?${q.toString()}`;
}

function SectionHeader({
  title,
  trendsSection,
  patientId,
}: {
  title: string;
  trendsSection: string;
  patientId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <h4 className="text-[12px] font-medium text-ink-600">{title}</h4>
      <Link
        href={trendsHref(patientId, trendsSection)}
        className="inline-flex items-center gap-1 text-[11px] text-info hover:underline shrink-0"
      >
        <LineChart className="h-3 w-3" />
        Trends
      </Link>
    </div>
  );
}

function IntakeRow({ row, prominent }: { row: NurseIntakeRow; prominent?: boolean }) {
  const abnormal = row.status === 'critical' || row.status === 'warning';
  return (
    <div
      className={`py-2 border-b border-ink-50 last:border-b-0 ${
        prominent && abnormal
          ? 'rounded-md border border-danger/30 bg-danger-soft/40 px-2 -mx-2'
          : abnormal
            ? 'rounded-md border border-warning/30 bg-warning-soft/30 px-2 -mx-2'
            : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] text-ink-600">{row.label}</span>
        {abnormal && (
          <span
            className={`text-[10px] font-medium uppercase tracking-wide shrink-0 ${
              row.status === 'critical' ? 'text-danger' : 'text-warning'
            }`}
          >
            {row.status === 'critical' ? 'Critical' : 'Abnormal'}
          </span>
        )}
      </div>
      <p
        className={`text-[14px] font-semibold tnum mt-0.5 ${
          row.status === 'critical'
            ? 'text-danger'
            : row.status === 'warning'
              ? 'text-warning'
              : 'text-ink-900'
        }`}
      >
        {row.value}
        {row.unit ? <span className="text-[12px] font-normal text-ink-500"> {row.unit}</span> : null}
      </p>
      {row.date && <p className="text-[10px] text-ink-400 mt-0.5">{row.date}</p>}
    </div>
  );
}

function IntakeSection({
  title,
  trendsSection,
  patientId,
  rows,
  emptyLabel,
}: {
  title: string;
  trendsSection: string;
  patientId: string;
  rows: NurseIntakeRow[];
  emptyLabel: string;
}) {
  return (
    <div>
      <SectionHeader title={title} trendsSection={trendsSection} patientId={patientId} />
      {rows.length === 0 ? (
        <p className="text-[12px] text-ink-500 py-1">{emptyLabel}</p>
      ) : (
        <div>
          {rows.map(row => (
            <IntakeRow key={row.label} row={row} prominent={title === 'Vital signs'} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NurseIntakeSidebar({
  patientId,
  observations,
}: {
  patientId: string;
  observations: Observation[];
}) {
  const summary = buildNurseIntakeSummary(observations);
  const hasAbnormalVitals = summary.vitals.some(
    r => r.status === 'warning' || r.status === 'critical',
  );

  return (
    <Card className="lg:sticky lg:top-[7.5rem]">
      <CardTitle icon={<Activity className="h-4 w-4" />}>Nurse intake</CardTitle>
      {!nurseIntakeHasData(summary) ? (
        <p className="text-[12px] text-ink-500 py-2">
          No vitals, anthropometrics, or point-of-care results yet.
        </p>
      ) : (
        <div className="space-y-4">
          {hasAbnormalVitals && (
            <p className="text-[11px] text-warning bg-warning-soft/50 border border-warning/20 rounded-md px-2 py-1.5">
              One or more vital signs are outside the usual range.
            </p>
          )}
          <IntakeSection
            title="Vital signs"
            trendsSection="vitals-signs-trends"
            patientId={patientId}
            rows={summary.vitals}
            emptyLabel="No vitals recorded"
          />
          <IntakeSection
            title="Anthropometrics"
            trendsSection="anthropometrics-trends"
            patientId={patientId}
            rows={summary.anthropometrics}
            emptyLabel="No height/weight/BMI"
          />
          <IntakeSection
            title="Point-of-care tests"
            trendsSection="laboratory-trends"
            patientId={patientId}
            rows={summary.poc}
            emptyLabel="No POC tests recorded"
          />
          {summary.nursingNote && (
            <div>
              <h4 className="text-[12px] font-medium text-ink-600 mb-1.5">Nursing note</h4>
              <p className="text-[12px] text-ink-800 whitespace-pre-wrap">{summary.nursingNote.value}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
