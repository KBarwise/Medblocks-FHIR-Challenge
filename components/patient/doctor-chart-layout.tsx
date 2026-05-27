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
    <div className="grid gap-4 xl:gap-5 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] items-start">
      <aside className="min-w-0 lg:sticky lg:top-44 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
        <NurseIntakeSidebar observations={observations} />
      </aside>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  );
}
