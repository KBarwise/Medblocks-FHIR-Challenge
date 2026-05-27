import { ClinicProvider } from '@/components/clinic/clinic-context';
import { AppShell } from '@/components/clinic/app-shell';
import { getClinicName } from '@/lib/clinic/server-clinic';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const clinicName = await getClinicName();
  return {
    title: clinicName,
    description: 'Clinical surveillance for incretin therapy',
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const initialClinicName = await getClinicName();
  const initialRole = getActingRoleFromCookie();

  return (
    <ClinicProvider initialClinicName={initialClinicName} initialRole={initialRole}>
      <AppShell>{children}</AppShell>
    </ClinicProvider>
  );
}
