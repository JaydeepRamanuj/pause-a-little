import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { PRAHAR, type Palette } from '../data/palettes';
import { getState, useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { fmt } from '../lib/util';
import { reset, setIntent, setMinutes, start, toggleSession } from '../app/session';
import { PauseIcon, PlayIcon, ResetIcon } from './icons';

const PRESETS = [10, 15, 20, 25, 45];
const RING = 2 * Math.PI * 47;

/**
 * The timer, shown in Focus: the dial, the intention, the focus length and play and reset.
 * Volume and mute are on the audio card, so they are not repeated here.
 */
export function Focus({ palette }: { palette: Palette }) {
  const timer = useStore(s => s.timer);
  const remaining = useStore(s => s.remaining);
  const minutes = useStore(s => s.minutes);
  const status = useStore(s => s.status);
  const intent = useStore(s => s.intent);
  const view = useStore(s => s.view);
  const source = useStore(s => s.source);
  const prahar = useStore(s => s.prahar);
  const controlsIdle = useStore(s => s.controlsIdle);

  const running = timer === 'running';
  const frac = minutes ? remaining / (minutes * 60000) : 0;
  const time = minutes ? fmt(remaining) : '∞';
  const isPreset = PRESETS.includes(minutes) || minutes === 0;
  const p = PRAHAR[prahar];
  // only Focus shows the timer
  const shown = view === 'focus';

  return (
    <div className="pointer-events-none fixed inset-0 z-[4] flex items-center justify-center px-4 pb-[84px] pt-[60px]">
      <motion.section
        layout
        transition={{ type: 'spring', stiffness: 260, damping: 32 }}
        aria-label="Focus timer"
        aria-hidden={!shown}
        className={cn('ui pointer-events-auto flex flex-col items-center transition-opacity duration-700', !shown && 'pointer-events-none hidden')}
      >
        {palette.raag && (
          <p className="mb-3 text-center text-[12px] uppercase tracking-[.22em] text-ink-soft" style={{ lineHeight: 1.8 }}>
            <span className="font-display text-[15px] normal-case tracking-normal text-accent">{p.hi}</span>
            {' · '}{p.en}{' · '}{p.ragas}
          </p>
        )}

        <div className="relative grid aspect-square w-[min(80vw,380px,max(220px,calc(100dvh_-_440px)))] place-items-center">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="45" style={{ fill: 'var(--glass)', opacity: 0.55 }} />
            <circle
              cx="50" cy="50" r="47" fill="none" strokeWidth={1.1}
              style={{ stroke: 'var(--track)' }}
              className={timer === 'done' ? 'animate-track-pulse' : undefined}
            />
            <circle
              cx="50" cy="50" r="47" fill="none" strokeWidth={1.1} strokeLinecap="round"
              style={{
                stroke: 'var(--accent)',
                opacity: 0.6,
                strokeDasharray: RING,
                strokeDashoffset: minutes ? RING * (1 - frac) : 0,
                transition: 'stroke-dashoffset .35s linear',
              }}
            />
          </svg>
          <div className="relative text-center">
            <div className="font-display text-[clamp(56px,min(17vw,11dvh),112px)] font-light leading-none tabular-nums tracking-[-.01em]">
              {time}
            </div>
            <div className="mt-3.5 min-h-[1.2em] text-[13px] uppercase tracking-[.14em] text-ink-soft">{source === 'songs' ? '' : status}</div>
          </div>
        </div>

        <IntentInput value={intent} onStart={() => { if (getState().timer !== 'running') start(); }} />

        <div className="mt-[clamp(18px,4dvh,34px)] flex max-w-[440px] flex-wrap justify-center gap-2 max-[560px]:mt-3">
          {PRESETS.map(m => (
            <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>{m}m</Chip>
          ))}
          <CustomMinutes active={!isPreset} value={minutes} />
        </div>

        <div className={cn('mt-[clamp(16px,3.5dvh,28px)] flex items-center gap-[18px] transition-opacity duration-700', controlsIdle && 'pointer-events-none opacity-0')}>
          <RoundButton size={44} label="Reset (R)" onClick={reset}>
            <ResetIcon className="size-[18px]" />
          </RoundButton>
          <button
            type="button"
            aria-label={running ? 'Pause' : 'Start'}
            title="Start / pause (Space)"
            onClick={toggleSession}
            className="glass grid size-[72px] place-items-center rounded-full transition-[background,transform] duration-300 hover:bg-glass-strong active:scale-[.94]"
          >
            {running ? <PauseIcon className="size-[26px]" /> : <PlayIcon className="size-[26px]" />}
          </button>
        </div>
      </motion.section>
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-[34px] min-w-[52px] rounded-full px-3.5 text-[13px] transition-[background,color] duration-300',
        active ? 'bg-ink text-bg' : 'glass hover:bg-glass-strong',
      )}
    >
      {children}
    </button>
  );
}

function RoundButton({ size, label, onClick, active = false, children }: {
  size: number; label: string; onClick: () => void; active?: boolean; children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full transition-[background,transform] duration-300 active:scale-[.94]',
        active ? 'bg-ink text-bg' : 'glass hover:bg-glass-strong',
      )}
    >
      {children}
    </button>
  );
}

function IntentInput({ value, onStart }: { value: string; onStart: () => void }) {
  return (
    <input
      type="text"
      maxLength={60}
      value={value}
      onChange={e => setIntent(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
          onStart();
        }
      }}
      placeholder="What will you focus on?"
      autoComplete="off"
      spellCheck={false}
      aria-label="Focus intention"
      className="mt-[clamp(12px,2.6dvh,22px)] w-[min(320px,80vw)] border-b border-track bg-transparent px-1 py-1.5 text-center font-display text-[17px] font-light italic text-ink outline-none transition-[border-color] duration-600 placeholder:text-ink-soft focus:border-ink-soft max-h-[600px]:hidden"
    />
  );
}

/** Custom minutes: committed on blur or Enter, as the timer room did. */
function CustomMinutes({ active, value }: { active: boolean; value: number }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (active ? String(value) : '');
  const commit = () => {
    const v = parseInt(draft ?? '', 10);
    if (v > 0) setMinutes(v);
    setDraft(null);
  };
  return (
    <label
      title="Custom minutes"
      className={cn(
        'inline-flex h-[34px] items-center gap-1 rounded-full py-0 pl-3 pr-1.5 text-[13px]',
        active ? 'bg-ink text-bg' : 'glass',
      )}
    >
      <input
        type="number"
        min={1}
        max={180}
        inputMode="numeric"
        placeholder="—"
        aria-label="Custom minutes"
        value={shown}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className="h-[26px] w-11 bg-transparent text-center text-[inherit]"
      />
      <span className={active ? 'pr-1.5 opacity-70' : 'pr-1.5 text-ink-soft'}>min</span>
    </label>
  );
}
