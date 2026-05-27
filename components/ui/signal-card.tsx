import { AlertTriangle, Eye, Flame, Frown, Droplet, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SafetySignal } from '@/lib/signals/rules';

const TONE: Record<SafetySignal['severity'], string> = {
  red: 'bg-danger-soft text-danger',
  amber: 'bg-warning-soft text-warning',
  blue: 'bg-info-soft text-info',
};

const ICON: Record<string, React.ReactNode> = {
  'acute-pancreatitis-suspected': <Flame className="h-4 w-4" />,
  'rapid-hba1c-reduction': <Eye className="h-4 w-4" />,
  'calcitonin-elevation': <AlertTriangle className="h-4 w-4" />,
  'creatinine-rise': <Droplet className="h-4 w-4" />,
  'phq9-elevated': <Frown className="h-4 w-4" />,
  'biliary-risk': <Activity className="h-4 w-4" />,
};

export function SignalCard({ signal }: { signal: SafetySignal }) {
  return (
    <div className={cn('flex gap-2.5 p-3 rounded-md mb-2 items-start text-[13px]', TONE[signal.severity])}>
      <div className="shrink-0 mt-0.5">{ICON[signal.id] ?? <AlertTriangle className="h-4 w-4" />}</div>
      <div className="flex-1">
        <div className="font-medium mb-0.5">{signal.title}</div>
        <div>{signal.detail}</div>
        <div className="text-[11px] opacity-80 mt-1">{signal.action}</div>
      </div>
    </div>
  );
}
