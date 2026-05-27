'use server';

import { revalidatePath } from 'next/cache';
import { createPractitioner } from '@/lib/fhir/practitioners';
import type { ProviderFormData } from '@/lib/fhir/practitioner-types';

export async function registerProvider(form: ProviderFormData) {
  const created = await createPractitioner(form);
  revalidatePath('/admin/providers');
  return created;
}
