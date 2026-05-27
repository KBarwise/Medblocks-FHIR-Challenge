import { redirect } from 'next/navigation';
import { homePathForRole } from '@/lib/clinic/nav';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';

export default function Home() {
  redirect(homePathForRole(getActingRoleFromCookie()));
}
