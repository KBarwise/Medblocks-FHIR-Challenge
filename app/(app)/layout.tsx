import { ClinicProvider } from '@/components/clinic/clinic-context';
import { AppShell } from '@/components/clinic/app-shell';
import { getClinicNameFromCookie } from '@/lib/clinic/server-clinic';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const clinicName = getClinicNameFromCookie();
  return {
    title: clinicName,
    description: 'Clinical surveillance for incretin therapy',
  };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const initialClinicName = getClinicNameFromCookie();
  const initialRole = getActingRoleFromCookie();

  return (
    <ClinicProvider initialClinicName={initialClinicName} initialRole={initialRole}>
      <AppShell>{children}</AppShell>
    </ClinicProvider>
  );
}
