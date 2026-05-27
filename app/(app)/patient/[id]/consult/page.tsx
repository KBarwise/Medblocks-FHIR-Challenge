import { redirect } from 'next/navigation';

/** Legacy URL — doctor consultation lives on the document route. */
export default function ConsultReviewRedirect({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const paramsQs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) paramsQs.append(key, v);
    } else {
      paramsQs.set(key, value);
    }
  }
  const q = paramsQs.toString();
  redirect(`/patient/${params.id}/consult/document${q ? `?${q}` : ''}`);
}
