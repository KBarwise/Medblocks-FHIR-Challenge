import { getNewReturningSymptomReports } from '@/app/(app)/kiosk/actions';
import { Card, CardTitle } from '@/components/ui/primitives';
import { ReturningSymptomActions } from '@/components/reception/returning-symptom-actions';
import { AlertTriangle } from 'lucide-react';

export async function ReturningSymptomPanel() {
  const reports = await getNewReturningSymptomReports();

  if (reports.length === 0) return null;

  return (
    <Card className="mb-4 border-danger/30">
      <CardTitle icon={<AlertTriangle className="h-4 w-4 text-danger" />}>
        Kiosk symptom alerts — needs follow-up
      </CardTitle>
      <p className="text-[12px] text-ink-500 mb-3">
        Returning patients who completed the kiosk symptom check today ({reports.length}). Clinical
        details are not shown at reception — queue a doctor follow-up or book an appointment.
      </p>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-xs text-ink-500 border-b border-ink-100">
            <th className="py-2 font-medium">Patient</th>
            <th className="py-2 font-medium">DOB</th>
            <th className="py-2 font-medium">Priority</th>
            <th className="py-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id} className="border-b border-ink-100 last:border-b-0">
              <td className="py-2.5 font-medium">{r.patientName}</td>
              <td className="py-2.5 text-ink-600">{r.birthDate}</td>
              <td className="py-2.5 text-ink-600">
                {r.urgent ? (
                  <span className="text-danger font-medium">Urgent follow-up</span>
                ) : (
                  'Routine check-in'
                )}
              </td>
              <td className="py-2.5 text-right">
                <ReturningSymptomActions
                  reportId={r.id}
                  patientId={r.patientId}
                  patientName={r.patientName}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
