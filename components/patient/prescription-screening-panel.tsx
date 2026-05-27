import { Card, CardTitle, Badge } from '@/components/ui/primitives';
import type { ScreeningEvaluation } from '@/lib/screening/evaluate-prescription';
import { AlertOctagon, AlertTriangle, CheckCircle2, ClipboardCheck } from 'lucide-react';

export function PrescriptionScreeningPanel({
  screening,
  compact = false,
}: {
  screening: ScreeningEvaluation;
  compact?: boolean;
}) {
  const overallTone =
    screening.overall === 'red' ? 'danger' : screening.overall === 'amber' ? 'warning' : 'success';
  const OverallIcon =
    screening.overall === 'red'
      ? AlertOctagon
      : screening.overall === 'amber'
        ? AlertTriangle
        : CheckCircle2;

  return (
    <section className={compact ? 'space-y-3' : 'space-y-4'}>
      <Card>
        <CardTitle icon={<OverallIcon className="h-4 w-4" />}>Pre-prescription screening</CardTitle>
        <p className="text-[12px] text-ink-500 mb-3">
          Active conditions validated against GLP-1 contraindication and caution value sets (Snowstorm).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={overallTone}>
            {screening.overall === 'red'
              ? 'Do not prescribe'
              : screening.overall === 'amber'
                ? 'Prescribe with caution'
                : 'No contraindications detected'}
          </Badge>
          <span className="text-[12px] text-ink-500">
            {screening.items.filter(i => i.level === 'red').length} absolute ·{' '}
            {screening.items.filter(i => i.level === 'amber').length} caution ·{' '}
            {screening.items.filter(i => i.level === 'clear').length} clear
          </span>
        </div>
      </Card>

      <Card>
        <CardTitle icon={<ClipboardCheck className="h-4 w-4" />}>Condition review</CardTitle>
        {screening.items.length === 0 ? (
          <p className="text-[13px] text-ink-500 py-2">No active conditions on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[28rem]">
              <thead>
                <tr className="text-left text-xs text-ink-500 border-b border-ink-100">
                  <th className="py-2 font-medium">Condition</th>
                  <th className="py-2 font-medium">Result</th>
                  <th className="py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {screening.items.map(item => (
                  <tr
                    key={item.condition.id ?? item.label}
                    className="border-b border-ink-100 last:border-b-0"
                  >
                    <td className="py-2.5 font-medium">{item.label}</td>
                    <td className="py-2.5">
                      <Badge
                        tone={
                          item.level === 'red'
                            ? 'danger'
                            : item.level === 'amber'
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {item.level}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-ink-500 text-[12px]">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
