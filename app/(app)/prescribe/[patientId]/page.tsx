import { Card, CardTitle } from '@/components/ui/primitives';
import { Pill } from 'lucide-react';
import { PrescribeForm } from './prescribe-form';

export default function PrescribePage({ params }: { params: { patientId: string } }) {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-medium mb-1">Prescribe incretin therapy</h1>
      <p className="text-sm text-ink-500 mb-4">Create a new prescription with terminology-validated coding</p>
      <Card>
        <CardTitle icon={<Pill className="h-4 w-4" />}>New prescription</CardTitle>
        <PrescribeForm patientId={params.patientId} />
      </Card>
    </div>
  );
}
