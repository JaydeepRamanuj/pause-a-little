import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { PRAHAR, type Palette } from '../data/palettes';
import { getState, useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { fmt } from '../lib/util';
import { goalFraction } from '../app/historyMath';
import { answerLookBack, reset, setIntent, setMinutes, skipBreak, start, toggleSession } from '../app/session';
import { BREATH_TEXT, breathAt, mandalaScale, type BreathId, type BreathKind } from '../app/breathMath';
import { setMandalaBreath } from '../lib/mandalaFx';
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
  const block = useStore(s => s.block);
  const cycle = useStore(s => s.cycle);
  const round = useStore(s => s.round);
  const lookBack = useStore(s => s.lookBack);
  const goal = useStore(s => s.goal);
  const todayMin = useStore(s => s.stats.today.min);
  const goalFrac = goalFraction(todayMin, goal);
  const [breathKind, setBreathKind] = useState<BreathKind>('in');

  const running = timer === 'running';
  const onBreak = cycle.on && block !== 'focus';
  const total = onBreak ? (block === 'short' ? cycle.shortMin : cycle.longMin) : minutes;
  const frac = total ? remaining / (total * 60000) : 0;
  const time = minutes ? fmt(remaining) : '∞';
  // the breathing guide runs while a break is counting down
  const guide: BreathId | null = onBreak && running && cycle.breathing !== 'off' ? cycle.breathing : null;
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
          {goal > 0 && (
            <svg
              viewBox="0 0 100 100" role="img" aria-label={`${todayMin} of ${goal} minutes of today's goal`}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[114%] w-[114%] -translate-x-1/2 -translate-y-1/2 -rotate-90"
            >
              <title>{`Today: ${todayMin} of ${goal} min`}</title>
              <circle cx="50" cy="50" r="48.6" fill="none" strokeWidth={0.7} style={{ stroke: 'var(--track)', opacity: 0.55 }} />
              <circle
                cx="50" cy="50" r="48.6" fill="none" strokeWidth={0.9} strokeLinecap="round"
                style={{
                  stroke: 'var(--accent)',
                  opacity: goalFrac >= 1 ? 0.85 : 0.5,
                  strokeDasharray: 2 * Math.PI * 48.6,
                  strokeDashoffset: 2 * Math.PI * 48.6 * (1 - goalFrac),
                  transition: 'stroke-dashoffset 1.2s ease',
                }}
              />
            </svg>
          )}
          {guide && <Breathing id={guide} onKind={setBreathKind} />}
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
                strokeDashoffset: total ? RING * (1 - frac) : 0,
                transition: 'stroke-dashoffset .35s linear',
              }}
            />
          </svg>
          <div className="relative text-center">
            <div className="font-display text-[clamp(56px,min(17vw,11dvh),112px)] font-light leading-none tabular-nums tracking-[-.01em]">
              {time}
            </div>
            <div className="mt-3.5 min-h-[1.2em] text-[13px] uppercase tracking-[.14em] text-ink-soft">{guide ? BREATH_TEXT[breathKind] : source === 'songs' && !onBreak ? '' : status}</div>
            {cycle.on && minutes > 0 && <RoundDots count={cycle.every} round={round} current={block === 'focus' && timer !== 'done'} />}
          </div>
        </div>

        {lookBack != null && timer === 'done'
          ? <LookBack />
          : <IntentInput value={intent} onStart={() => { if (getState().timer !== 'running') start(); }} />}

        <div className="mt-[clamp(18px,4dvh,34px)] flex max-w-[440px] flex-wrap justify-center gap-2 max-[560px]:mt-3">
          {onBreak ? (
            <Chip active={false} onClick={skipBreak}>Skip break</Chip>
          ) : (
            <>
              {PRESETS.map(m => (
                <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>{m}m</Chip>
              ))}
              <CustomMinutes active={!isPreset} value={minutes} />
            </>
          )}
        </div>

        <div className={cn('mt-[clamp(16px,3.5dvh,28px)] flex items-center gap-[18px] transition-opacity duration-700', controlsIdle && 'pointer-events-none opacity-0')}>
          <RoundButton size={44} label="Reset (R)" onClick={reset}>
            <ResetIcon className="size-[18px]" />
          </RoundButton>
          <button
            type="button"
            aria-label={running ? 'Pause' : onBreak ? 'Start break' : 'Start'}
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

/** Dots for the focus sessions of the cycle: filled when done, the next one glows. */
function RoundDots({ count, round, current }: { count: number; round: number; current: boolean }) {
  return (
    <div className="mt-3 flex justify-center gap-1.5" role="img" aria-label={`${round} of ${count} focus sessions done`}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn('size-1.5 rounded-full border transition-[background,border-color] duration-500', i < round ? 'border-transparent bg-ink-soft' : 'border-track')}
          style={i === round && current ? { background: 'var(--accent)', borderColor: 'transparent' } : undefined}
        />
      ))}
    </div>
  );
}

/**
 * The breathing guide: a soft disc behind the time that grows as you breathe in and
 * shrinks as you breathe out, and the mandala follows. Still (text only) with reduced motion.
 */
function Breathing({ id, onKind }: { id: BreathId; onKind: (k: BreathKind) => void }) {
  const disc = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0;
    let last: BreathKind | null = null;
    const frame = (now: number) => {
      const { kind, level } = breathAt(id, (now - t0) / 1000);
      if (!reduce) {
        if (disc.current) disc.current.style.transform = `scale(${0.7 + 0.3 * level})`;
        setMandalaBreath(mandalaScale(level));
      }
      if (kind !== last) {
        last = kind;
        onKind(kind);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      setMandalaBreath(1);
    };
  }, [id, onKind]);
  return (
    <div
      ref={disc}
      aria-hidden="true"
      className="absolute inset-[4%] rounded-full will-change-transform"
      style={{
        background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 26%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 62%, transparent 72%)',
        transform: 'scale(.7)',
      }}
    />
  );
}

/** After a focus session: how did it feel (1–3 dots) and an optional note. Skippable. */
function LookBack() {
  const [feel, setFeel] = useState<1 | 2 | 3 | undefined>();
  const [note, setNote] = useState('');
  const labels = ['Scattered', 'Steady', 'Deep'] as const;
  return (
    <div className="glass mt-[clamp(10px,2.4dvh,20px)] flex w-[min(320px,86vw)] flex-col items-center gap-2.5 rounded-3xl px-4 py-3">
      <p className="text-[12px] uppercase tracking-[.16em] text-ink-soft">How did that feel?</p>
      <div className="flex gap-2">
        {([1, 2, 3] as const).map(n => (
          <button
            key={n}
            type="button"
            aria-label={labels[n - 1]}
            aria-pressed={feel === n}
            onClick={() => setFeel(feel === n ? undefined : n)}
            className={cn('flex h-9 min-w-[74px] flex-col items-center justify-center rounded-full px-3 text-[11px] transition-[background,color] duration-300', feel === n ? 'bg-ink text-bg' : 'hover:bg-glass-strong')}
          >
            <span className="flex gap-[3px]" aria-hidden="true">
              {Array.from({ length: n }, (_, i) => <i key={i} className="block size-1.5 rounded-full bg-current" />)}
            </span>
            <span className="mt-0.5 leading-none opacity-80">{labels[n - 1]}</span>
          </button>
        ))}
      </div>
      <input
        type="text"
        maxLength={140}
        value={note}
        onChange={e => setNote(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') answerLookBack(feel, note); }}
        placeholder="A note, if you like"
        aria-label="Look-back note"
        autoComplete="off"
        className="w-full border-b border-track bg-transparent px-1 py-1 text-center text-[13px] outline-none placeholder:text-ink-soft focus:border-ink-soft"
      />
      <button type="button" onClick={() => answerLookBack(feel, note)} className="text-[12px] text-ink-soft underline-offset-4 hover:underline">
        {feel || note.trim() ? 'Save' : 'Skip'}
      </button>
    </div>
  );
}
