import { redirect } from 'next/navigation';

/** Legacy URL — terminology lives under clinic settings. */
export default function BindingsRedirect() {
  redirect('/admin/settings#terminology');
}
