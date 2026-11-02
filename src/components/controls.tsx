import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/** A section title inside a panel. */
export const Heading = ({ children }: { children: ReactNode }) => (
  <h3 className="mx-0.5 mb-2.5 mt-[22px] text-[11.5px] font-medium uppercase tracking-[.16em] text-ink-soft">{children}</h3>
);

/** A row of options, one of them active. */
export function Seg<T extends string>({ options, value, onChange, className }: {
  options: [T, string][]; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div role="group" className={cn('glass flex rounded-full p-[3px]', className)}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === value}
          onClick={() => onChange(v)}
          className={cn(
            'h-[34px] flex-1 rounded-full text-[13px] transition-[background,color] duration-300',
            v === value && 'bg-ink text-bg',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** A labelled horizontal slider. */
export function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mt-3 flex items-center gap-3 text-xs text-ink-soft">
      <span className="w-16">{label}</span>
      <input
        type="range" min={0} max={1} step={0.01} value={value} aria-label={label}
        onChange={e => onChange(+e.target.value)}
        className="flex-1"
      />
    </label>
  );
}

/** An on/off switch. */
export function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl glass px-4 py-2.5 text-left text-sm"
    >
      <span>{label}</span>
      <span className={cn('relative h-6 w-11 flex-none rounded-full transition-colors duration-300', on ? 'bg-ink' : 'bg-track')}>
        <span
          className={cn('absolute top-0.5 size-5 rounded-full bg-bg transition-transform duration-300', on ? 'translate-x-[22px]' : 'translate-x-0.5')}
        />
      </span>
    </button>
  );
}

export const fieldClass = 'h-10 w-full rounded-[14px] border border-glass-border bg-glass px-3 text-sm text-ink outline-none placeholder:text-ink-soft';
