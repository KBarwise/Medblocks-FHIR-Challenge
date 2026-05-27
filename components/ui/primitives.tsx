import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white border border-ink-100 rounded-lg p-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
      {icon && <span className="text-ink-500">{icon}</span>}
      {children}
    </h3>
  );
}

export function Metric({ label, value, sub, tone = 'default' }: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'danger' | 'warning' | 'success' | 'info';
}) {
  const toneClass = {
    default: 'text-ink-900',
    danger: 'text-danger',
    warning: 'text-warning',
    success: 'text-accent',
    info: 'text-info',
  }[tone];
  return (
    <div className="bg-ink-50 rounded-md p-3.5">
      <div className="text-xs text-ink-500 mb-1.5">{label}</div>
      <div className={cn('text-[22px] font-medium tnum', toneClass)}>{value}</div>
      {sub && <div className="text-[11px] text-ink-500 mt-1">{sub}</div>}
    </div>
  );
}

export function Badge({ tone = 'info', children }: { tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'; children: ReactNode }) {
  const map = {
    info: 'bg-info-soft text-info',
    success: 'bg-accent-soft text-accent',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    neutral: 'bg-ink-50 text-ink-700',
  };
  return <span className={cn('inline-block text-[11px] font-medium px-2 py-0.5 rounded', map[tone])}>{children}</span>;
}

export function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-[13px] border-b border-ink-100 last:border-b-0">
      <span className="text-ink-500">{k}</span>
      <span className="text-ink-900 tnum">{children}</span>
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-mono px-1.5 py-0.5 bg-ink-50 text-ink-500 rounded">
      {children}
    </span>
  );
}
