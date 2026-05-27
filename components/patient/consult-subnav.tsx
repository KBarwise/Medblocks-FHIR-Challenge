'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ConsultSubnav({
  patientId,
  embedded = false,
}: {
  patientId: string;
  embedded?: boolean;
}) {
  const pathname = usePathname();
  const chartHref = `/patient/${patientId}`;
  const documentHref = `/patient/${patientId}/consult/document`;
  const onDocument = pathname.startsWith(documentHref);

  return (
    <nav className={cn('flex gap-2 text-[12px]', embedded ? 'mt-3 mb-0' : 'mb-4')}>
      <Link
        href={chartHref}
        className={cn(
          'px-3 py-1.5 rounded-md border',
          !onDocument
            ? 'bg-ink-900 text-white border-ink-900'
            : 'bg-white border-ink-100 text-ink-600 hover:border-ink-200',
        )}
      >
        1. Clinical chart
      </Link>
      <Link
        href={documentHref}
        className={cn(
          'px-3 py-1.5 rounded-md border',
          onDocument
            ? 'bg-ink-900 text-white border-ink-900'
            : 'bg-white border-ink-100 text-ink-600 hover:border-ink-200',
        )}
      >
        2. Consultation note
      </Link>
    </nav>
  );
}
