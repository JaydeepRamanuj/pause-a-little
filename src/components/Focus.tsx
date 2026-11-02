import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { PRAHAR, type Palette } from '../data/palettes';
import { getState, useStore } from '../lib/store';
import { cn } from '../lib/cn';
import { fmt } from '../lib/util';
import { reset, setIntent, setMinutes, setSheet, setSoundOn, setVolume, start, toggleSession } from '../app/session';
import { PauseIcon, PlayIcon, ResetIcon, SettingsIcon, SoundOffIcon, SoundOnIcon } from './icons';

const PRESETS = [10, 15, 20, 25, 45];
const RING = 2 * Math.PI * 47;

/** The focus card: the dial, the intention, the durations and the transport. */
export function Focus({ palette }: { palette: Palette }) {
  const timer = useStore(s => s.timer);
  const remaining = useStore(s => s.remaining);
  const minutes = useStore(s => s.minutes);
  const status = useStore(s => s.status);
  const intent = useStore(s => s.intent);
  const corner = useStore(s => s.words.mode === 'corner');
  const soundOn = useStore(s => s.soundOn);
  const source = useStore(s => s.source);
  const ambientVol = useStore(s => s.ambientVol);
  const musicVol = useStore(s => s.musicVol);
  const prahar = useStore(s => s.prahar);

  const running = timer === 'running';
  const frac = minutes ? remaining / (minutes * 60000) : 0;
  const time = minutes ? fmt(remaining) : '∞';
  const volume = source === 'ambient' ? ambientVol : musicVol;
  const isPreset = PRESETS.includes(minutes) || minutes === 0;
  const p = PRAHAR[prahar];

  return (
    <div className="pointer-events-none fixed inset-0 z-[4] flex items-center justify-center px-4 pb-[84px] pt-[60px]">
      <motion.section
        layout
        transition={{ type: 'spring', stiffness: 260, damping: 32 }}
        aria-label="Focus timer"
        className={cn(
          'pointer-events-auto flex flex-col items-center',
          corner && 'glass fixed inset-x-0 bottom-4 mx-auto w-max flex-row gap-3 rounded-[30px] py-2.5 pl-2.5 pr-3 min-[760px]:inset-x-auto min-[760px]:bottom-7 min-[760px]:left-7 min-[760px]:mx-0',
        )}
      >
        {palette.raag && !corner && (
          <p className="mb-3 text-center text-[12px] uppercase tracking-[.22em] text-ink-soft" style={{ lineHeight: 1.8 }}>
            <span className="font-display text-[15px] normal-case tracking-normal text-accent">{p.hi}</span>
            {' · '}{p.en}{' · '}{p.ragas}
          </p>
        )}

        <div
          className={cn(
            'relative grid aspect-square place-items-center',
            corner ? 'w-[88px] shrink-0' : 'w-[min(80vw,380px,max(220px,calc(100dvh_-_440px)))]',
          )}
        >
          <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90">
            {!corner && <circle cx="50" cy="50" r="45" style={{ fill: 'var(--glass)', opacity: 0.55 }} />}
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
            <div
              className={cn(
                'font-display font-light leading-none tabular-nums tracking-[-.01em]',
                corner ? 'text-[21px]' : 'text-[clamp(56px,min(17vw,11dvh),112px)]',
              )}
            >
              {time}
            </div>
            {!corner && (
              <div className="mt-3.5 min-h-[1.2em] text-[13px] uppercase tracking-[.14em] text-ink-soft">{status}</div>
            )}
          </div>
        </div>

        {!corner && (
          <IntentInput value={intent} onStart={() => { if (getState().timer !== 'running') start(); }} />
        )}

        {!corner && (
          <div className="mt-[clamp(18px,4dvh,34px)] flex max-w-[440px] flex-wrap justify-center gap-2 max-[560px]:mt-3">
            {PRESETS.map(m => (
              <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>{m}m</Chip>
            ))}
            <CustomMinutes active={!isPreset} value={minutes} />
          </div>
        )}

        <div className={cn('flex items-center', corner ? 'gap-2' : 'mt-[clamp(16px,3.5dvh,28px)] gap-[18px]')}>
          <RoundButton size={corner ? 40 : 44} label="Reset (R)" onClick={reset}>
            <ResetIcon className="size-[18px]" />
          </RoundButton>
          <button
            type="button"
            aria-label={running ? 'Pause' : 'Start'}
            title="Start / pause (Space)"
            onClick={toggleSession}
            className={cn(
              'glass grid place-items-center rounded-full transition-[background,transform] duration-300 hover:bg-glass-strong active:scale-[.94]',
              corner ? 'size-[52px]' : 'size-[72px]',
            )}
          >
            {running
              ? <PauseIcon className={corner ? 'size-5' : 'size-[26px]'} />
              : <PlayIcon className={corner ? 'size-5' : 'size-[26px]'} />}
          </button>
          <RoundButton size={corner ? 40 : 44} label={soundOn ? 'Mute (M)' : 'Unmute (M)'} onClick={() => setSoundOn(!soundOn)} active={!soundOn}>
            {soundOn ? <SoundOnIcon className="size-[18px]" /> : <SoundOffIcon className="size-[18px]" />}
          </RoundButton>
          {corner && (
            <RoundButton size={40} label="Settings" onClick={() => setSheet(true)}>
              <SettingsIcon className="size-[18px]" />
            </RoundButton>
          )}
        </div>

        {!corner && (
          <label className="mt-[18px] flex w-[min(220px,60vw)] items-center gap-2.5 max-h-[560px]:hidden" title="Volume">
            <input
              type="range" min={0} max={1} step={0.01} value={volume} aria-label="Volume"
              onChange={e => setVolume(+e.target.value)}
              className="flex-1"
            />
          </label>
        )}
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
