'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useClinic } from '@/components/clinic/clinic-context';
import { PatientNavTrendsButton } from '@/components/patient/trends-open-button';

export function PatientNav({
  patientId,
  embedded = false,
  toolbar = false,
}: {
  patientId: string;
  /** When true, sits inside sticky patient chrome (no extra bottom margin). */
  embedded?: boolean;
  /** Compact toolbar under the banner (nurse); Trends sits on the right. */
  toolbar?: boolean;
}) {
  const pathname = usePathname();
  const { role } = useClinic();

  const tabs =
    role === 'nurse'
      ? [
          { href: `/patient/${patientId}`, label: 'Chart', exact: true },
          { href: `/patient/${patientId}/nurse`, label: 'Nurse documentation' },
        ]
      : role === 'doctor'
        ? [
            {
              href: `/patient/${patientId}/consult/document`,
              label: 'Consultation',
              exact: true,
            },
          ]
        : [];

  const showTrends = role === 'nurse' || role === 'doctor';

  if (tabs.length === 0 && !showTrends) return null;

  if (toolbar) {
    return (
      <nav className="flex items-center justify-between gap-3">
        <div className="flex gap-1 min-w-0">
          {tabs.map(tab => {
            const exact = 'exact' in tab && tab.exact;
            const active = exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-3 py-1.5 text-[12px] rounded-md border transition-colors',
                  active
                    ? 'bg-ink-900 text-white border-ink-900'
                    : 'bg-white border-ink-100 text-ink-600 hover:border-ink-200',
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        {showTrends && <PatientNavTrendsButton />}
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        'flex items-center justify-between gap-3',
        !embedded && 'mb-4 border-b border-ink-100',
        embedded && !toolbar && 'mt-2 border-b border-ink-100',
      )}
    >
      <div className="flex gap-1 min-w-0">
        {tabs.map(tab => {
          const exact = 'exact' in tab && tab.exact;
          const active = exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'px-3 py-2 text-[12px] border-b-2 -mb-px transition-colors',
                active
                  ? 'border-ink-900 text-ink-900 font-medium'
                  : 'border-transparent text-ink-500 hover:text-ink-700',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {showTrends && <PatientNavTrendsButton className="-mb-px" />}
    </nav>
  );
}
