import { Card, CardTitle } from '@/components/ui/primitives';
import { UserPlus } from 'lucide-react';
import { PatientForm } from './patient-form';
import { loadKioskIntakeForRegistration } from '@/app/(app)/kiosk/actions';
import { intakeToRegistrationDefaults, kioskLeadDisplayName } from '@/lib/kiosk/intake-types';
import { emptyPatientForm } from '@/lib/fhir/us-core-patient';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { intake?: string };
}) {
  let initial = undefined;
  let intakeBanner: string | undefined;

  if (searchParams.intake) {
    const lead = await loadKioskIntakeForRegistration(searchParams.intake);
    if (lead) {
      const defaults = intakeToRegistrationDefaults(lead);
      initial = { ...emptyPatientForm(), ...defaults };
      intakeBanner =
        lead.pathway === 'diet-exercise'
          ? `${kioskLeadDisplayName(lead.demographics)} — diet & exercise pathway (not eligible for GLP-1 at kiosk)`
          : `${kioskLeadDisplayName(lead.demographics)} — passed GLP-1 kiosk pre-screening`;
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-medium mb-1">Register Patients</h1>
      <p className="text-sm text-ink-500 mb-4">
        Use Next and Back to move through each section. Your entries autosave once a name is entered.
      </p>
      {intakeBanner && (
        <p className="text-[13px] text-accent bg-accent-soft border border-accent/20 rounded-md px-3 py-2 mb-4">
          {intakeBanner}
        </p>
      )}
      <Card>
        <CardTitle icon={<UserPlus className="h-4 w-4" />}>New patient</CardTitle>
        <PatientForm initial={initial} intakeId={searchParams.intake} />
      </Card>
    </div>
  );
}
