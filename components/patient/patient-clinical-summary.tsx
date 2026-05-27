import { SignalCard } from '@/components/ui/signal-card';
import { Card, CardTitle } from '@/components/ui/primitives';
import { Activity } from 'lucide-react';
import type { SafetySignal } from '@/lib/signals/rules';

export function PatientClinicalSummary({ signals }: { signals: SafetySignal[] }) {
  const red = signals.filter(s => s.severity === 'red');
  const amber = signals.filter(s => s.severity === 'amber');
  const blue = signals.filter(s => s.severity === 'blue');

  return (
    <>
      <Card className="mb-3">
        <CardTitle icon={<Activity className="h-4 w-4" />}>Safety signals</CardTitle>
        {signals.length === 0 ? (
          <p className="text-[13px] text-ink-500 py-2">No active safety signals for this patient.</p>
        ) : (
          <div className="space-y-1">
            {[...red, ...amber, ...blue].map(s => (
              <SignalCard key={s.id} signal={s} />
            ))}
          </div>
        )}
      </Card>

    </>
  );
}
