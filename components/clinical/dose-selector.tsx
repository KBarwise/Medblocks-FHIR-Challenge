import { cn } from '@/lib/utils';

/** Selectable dose boxes for incretin titration steps. */
export function DoseSelector({
  doses,
  selectedIndex,
  onSelect,
  unit = 'mg',
}: {
  doses: readonly string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  unit?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Weekly dose">
      {doses.map((dose, i) => {
        const selected = selectedIndex === i;
        return (
          <button
            key={`${dose}-${i}`}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={selected}
            className={cn(
              'min-w-[4.25rem] px-3 py-2.5 rounded-md text-[13px] border text-center font-medium tnum transition-colors',
              selected
                ? 'bg-accent-soft text-accent border-accent/30'
                : 'bg-ink-50 border-ink-100 text-ink-800 hover:border-ink-200',
            )}
          >
            {dose} {unit}
          </button>
        );
      })}
    </div>
  );
}
