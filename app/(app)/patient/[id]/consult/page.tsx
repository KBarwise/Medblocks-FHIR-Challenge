import { redirect } from 'next/navigation';

/** Legacy URL — clinical chart lives on the patient root. */
export default function ConsultReviewRedirect({ params }: { params: { id: string } }) {
  redirect(`/patient/${params.id}`);
}
