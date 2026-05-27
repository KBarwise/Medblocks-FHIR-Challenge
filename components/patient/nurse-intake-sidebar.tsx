'use client';

import { useMemo, useState } from 'react';
import { Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/primitives';
import {
  anthropometricsForDoctorSidebar,
  buildNurseIntakeSummary,
  isAbnormalIntakeRow,
  nurseIntakeHasData,
  partitionVitalSignRows,
  type NurseIntakeRow,
} from '@/lib/clinical/nurse-intake-summary';
import type { Observation } from '@/lib/fhir/resources';
import { TrendsOpenButton } from '@/components/patient/trends-open-button';
import { cn } from '@/lib/utils';

function SectionHeader({
  title,
  trendsSection,
}: {
  title: string;
  trendsSection: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <h4 className="text-[12px] font-medium text-ink-600">{title}</h4>
      <TrendsOpenButton section={trendsSection} />
    </div>
  );
}

function IntakeRow({ row, prominent }: { row: NurseIntakeRow; prominent?: boolean }) {
  const abnormal = isAbnormalIntakeRow(row);
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

function collapsibleSummary(rows: NurseIntakeRow[], emptyLabel: string): string {
  if (rows.length === 0) return emptyLabel;
  return rows.map(r => `${r.label}: ${r.value}${r.unit ? ` ${r.unit}` : ''}`).join(' · ');
}

function CollapsibleIntakeRows({
  title,
  rows,
  emptyLabel,
  trendsSection,
  defaultExpanded = false,
}: {
  title: string;
  rows: NurseIntakeRow[];
  emptyLabel: string;
  trendsSection?: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const summaryHint = collapsibleSummary(rows, emptyLabel);

  return (
    <div className="border border-ink-100 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-2 px-2.5 py-2 text-left bg-ink-50/60 hover:bg-ink-50 transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-ink-500 shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="h-4 w-4 text-ink-500 shrink-0 mt-0.5" />
        )}
        <span className="flex-1 min-w-0">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-ink-700">{title}</span>
            {trendsSection ? (
              <span className="shrink-0" onClick={e => e.stopPropagation()}>
                <TrendsOpenButton section={trendsSection} />
              </span>
            ) : null}
          </span>
          {!expanded && (
            <span className="block text-[11px] text-ink-500 truncate mt-0.5">{summaryHint}</span>
          )}
        </span>
      </button>
      {expanded && (
        <div className={cn('px-2.5 pb-2 pt-1 border-t border-ink-100')}>
          {rows.length === 0 ? (
            <p className="text-[12px] text-ink-500 py-1">{emptyLabel}</p>
          ) : (
            <div>
              {rows.map(row => (
                <IntakeRow key={row.label} row={row} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VitalSignsSection({
  prominent,
  normal,
}: {
  prominent: NurseIntakeRow[];
  normal: NurseIntakeRow[];
}) {
  const hasAny = prominent.length > 0 || normal.length > 0;

  return (
    <div>
      <SectionHeader title="Vital signs" trendsSection="vitals-signs-trends" />
      {!hasAny ? (
        <p className="text-[12px] text-ink-500 py-1">No vitals recorded</p>
      ) : (
        <div className="space-y-2">
          {prominent.length > 0 && (
            <div>
              {prominent.map(row => (
                <IntakeRow key={row.label} row={row} prominent />
              ))}
            </div>
          )}
          {normal.length > 0 && (
            <CollapsibleIntakeRows
              title={`Normal vital signs (${normal.length})`}
              rows={normal}
              emptyLabel="None"
            />
          )}
        </div>
      )}
    </div>
  );
}

function IntakeSection({
  title,
  trendsSection,
  rows,
  emptyLabel,
}: {
  title: string;
  trendsSection: string;
  rows: NurseIntakeRow[];
  emptyLabel: string;
}) {
  return (
    <div>
      <SectionHeader title={title} trendsSection={trendsSection} />
      {rows.length === 0 ? (
        <p className="text-[12px] text-ink-500 py-1">{emptyLabel}</p>
      ) : (
        <div>
          {rows.map(row => (
            <IntakeRow key={row.label} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NurseIntakeSidebar({
  observations,
}: {
  observations: Observation[];
}) {
  const summary = buildNurseIntakeSummary(observations);
  const anthropometrics = useMemo(
    () => anthropometricsForDoctorSidebar(summary.anthropometrics),
    [summary.anthropometrics],
  );
  const { prominent: prominentVitals, normal: normalVitals } = useMemo(
    () => partitionVitalSignRows(summary.vitals),
    [summary.vitals],
  );
  const hasAbnormalVitals = summary.vitals.some(isAbnormalIntakeRow);

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
          <VitalSignsSection prominent={prominentVitals} normal={normalVitals} />
          <CollapsibleIntakeRows
            title="Anthropometrics"
            rows={anthropometrics}
            emptyLabel="No height or waist circumference recorded"
            trendsSection="anthropometrics-trends"
          />
          <IntakeSection
            title="Point-of-care tests"
            trendsSection="laboratory-trends"
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
