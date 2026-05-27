'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useClinic } from './clinic-context';
import { roleAllowsPath, accessDeniedMessage } from '@/lib/clinic/access';
import { homePathForRole } from '@/lib/clinic/nav';

export function RoleAccessGate({ children }: { children: React.ReactNode }) {
  const { role, ready } = useClinic();
  const pathname = usePathname();
  const router = useRouter();
  const allowed = roleAllowsPath(role, pathname);

  useEffect(() => {
    if (!ready || allowed) return;
    router.replace(homePathForRole(role));
  }, [allowed, ready, role, router]);

  if (!ready) {
    return <>{children}</>;
  }

  if (!allowed) {
    return (
      <div className="p-8 max-w-md">
        <h1 className="text-lg font-medium mb-2">Access restricted</h1>
        <p className="text-sm text-ink-500">{accessDeniedMessage(role)}</p>
      </div>
    );
  }

  return <>{children}</>;
}
