import { NurseIntakeSidebar } from '@/components/patient/nurse-intake-sidebar';
import type { Observation } from '@/lib/fhir/resources';

/** Doctor consultation layout: nurse intake on the left, chart content on the right. */
export function DoctorChartLayout({
  observations,
  children,
}: {
  observations: Observation[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_1fr] lg:items-start">
      <aside className="min-w-0">
        <NurseIntakeSidebar observations={observations} />
      </aside>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  );
}
