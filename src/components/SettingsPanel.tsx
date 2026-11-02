import { motion } from 'motion/react';
import { LANGS } from '../data/words';
import {
  hm, setClean, setCleanClock, setDroneKeyIndex, setDroneVolume, setSheet,
  setShapeStyle, setSongVisual, setWords, toggleDrone, toggleLang,
} from '../app/session';
import { useStore } from '../lib/store';
import type { ShapeStyle } from '../lib/store';
import { cn } from '../lib/cn';
import { Chip } from './Focus';
import { Heading, Slider, fieldClass } from './controls';
import { CALM_VISUALS } from './calmArt';
import { CloseIcon } from './icons';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F'];

/**
 * The settings panel, from the top right. Generic settings first, then the ones for the
 * current sound type. Modes and volume are not here: the top bar and the audio card have them.
 */
export function SettingsPanel() {
  const open = useStore(s => s.sheet);
  const source = useStore(s => s.source);
  return (
    <>
      <motion.div
        aria-hidden="true"
        onClick={() => setSheet(false)}
        className="fixed inset-0 z-[9] bg-black/[.12]"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : -16 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        className="themed-scroll fixed right-3 top-[max(64px,calc(env(safe-area-inset-top)_+_56px))] z-10 flex max-h-[min(78dvh,760px)] w-[min(560px,calc(100vw_-_24px))] flex-col overflow-hidden rounded-3xl border border-glass-border sheet-surface shadow-[0_20px_60px_rgba(0,0,0,.18)] backdrop-blur-[24px] backdrop-saturate-[1.3]"
      >
        <div className="themed-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] pb-[18px] pt-5">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-display text-[22px] font-normal">Settings</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSheet(false)}
              className="glass grid size-9 place-items-center rounded-full hover:bg-glass-strong"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>

          <p className="mt-4 text-[11px] uppercase tracking-[.2em] text-ink-soft">For every mode</p>
          <ScreenSection />
          <WordsSection />
          <FocusSection />

          <p className="mt-6 text-[11px] uppercase tracking-[.2em] text-ink-soft">
            {source === 'ambient' ? 'Ambient' : source === 'raag' ? 'Raag' : 'Calm songs'}
          </p>
          {source === 'raag' && <RaagSettings />}
          {source === 'songs' && <CalmSettings />}
          {source === 'ambient' && <AmbientSettings />}
        </div>
      </motion.section>
    </>
  );
}

function ScreenSection() {
  const clean = useStore(s => s.clean);
  const cleanClock = useStore(s => s.cleanClock);
  return (
    <>
      <Heading>Screen</Heading>
      <div className="flex flex-wrap gap-2">
        <Chip active={clean} onClick={() => setClean(!clean)}>Clean screen</Chip>
        <Chip active={cleanClock} onClick={() => setCleanClock(!cleanClock)}>Clock in clean screen</Chip>
      </div>
      <p className="mx-0.5 mt-3 text-[11.5px] leading-relaxed text-ink-soft">
        Clean screen hides every control. Move the mouse or press a key to bring them back for a few seconds. Press H to toggle it.
      </p>
    </>
  );
}

// ---------- Raag ----------

/** Raag: the tanpura, which plays only in Raag. The mandala has its own card. */
function RaagSettings() {
  const drone = useStore(s => s.drone);
  const droneKey = useStore(s => s.droneKey);
  const droneVol = useStore(s => s.droneVol);
  return (
    <>
      <Heading>Tanpura</Heading>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={drone} onClick={toggleDrone}>{drone ? 'On' : 'Off'}</Chip>
        <span className="ml-1.5 text-xs text-ink-soft">Sa</span>
        {KEYS.map((k, i) => (
          <Chip key={k} active={droneKey === i} onClick={() => setDroneKeyIndex(i)}>{k}</Chip>
        ))}
      </div>
      <Slider label="Tanpura" value={droneVol} onChange={setDroneVolume} />
    </>
  );
}

// ---------- Ambient ----------

function AmbientSettings() {
  const style = useStore(s => s.shapeStyle);
  const options: [ShapeStyle, string][] = [['orbs', 'Orbs'], ['arcs', 'Arcs'], ['waves', 'Waves'], ['prisms', 'Prisms']];
  return (
    <>
      <Heading>Art</Heading>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, label]) => (
          <Chip key={id} active={style === id} onClick={() => setShapeStyle(id)}>{label}</Chip>
        ))}
      </div>
    </>
  );
}

// ---------- Calm songs ----------

function CalmSettings() {
  const visual = useStore(s => s.songVisual);
  const families = ['Ripples', 'Particles'] as const;
  return (
    <>
      {families.map(family => (
        <div key={family}>
          <Heading>{family}</Heading>
          <div className="flex flex-wrap gap-2">
            {CALM_VISUALS.filter(v => v.family === family).map(v => (
              <Chip key={v.id} active={visual === v.id} onClick={() => setSongVisual(v.id)}>{v.name}</Chip>
            ))}
          </div>
        </div>
      ))}
      <p className="mx-0.5 mt-3 text-[11.5px] leading-relaxed text-ink-soft">
        Ripples follow the beat, and Particles drift with the bass and bloom on the beat. Your own files react fully; YouTube plays in its own frame, so these show a gentle motion instead.
      </p>
    </>
  );
}

// ---------- generic: focus statistics, words ----------

function FocusSection() {
  const stats = useStore(s => s.stats);
  return (
    <>
      <Heading>Your focus</Heading>
      <div className="grid grid-cols-3 gap-2">
        <StatCard value={hm(stats.today.min)} label="Today" />
        <StatCard value={hm(stats.week)} label="This week" />
        <StatCard value={String(stats.streak)} label="Day streak" />
      </div>
    </>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-2xl px-1.5 py-3 text-center">
      <b className="block font-display text-2xl font-light leading-[1.1]">{value}</b>
      <span className="mt-1 block text-[10.5px] uppercase tracking-[.14em] text-ink-soft">{label}</span>
    </div>
  );
}

function WordsSection() {
  const words = useStore(s => s.words);
  const mine = words.mine.split('\n').some(x => x.trim());

  const toggleKind = (k: 'calm' | 'poems') => {
    const next = !words[k];
    const otherOn = k === 'calm' ? words.poems : words.calm;
    const keepOther = !next && !otherOn && !mine; // keep something to show
    setWords(k === 'calm'
      ? { calm: next, poems: keepOther ? true : words.poems }
      : { poems: next, calm: keepOther ? true : words.calm });
  };

  return (
    <>
      <Heading>Words</Heading>
      <div className="flex flex-wrap gap-2">
        {LANGS.map(l => (
          <Chip key={l.id} active={words.langs.includes(l.id)} onClick={() => toggleLang(l.id)}>{l.name}</Chip>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={words.calm} onClick={() => toggleKind('calm')}>Calm lines</Chip>
        <Chip active={words.poems} onClick={() => toggleKind('poems')}>Poems &amp; sayings</Chip>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Chip active={words.speed === 30} onClick={() => setWords({ speed: 30 })}>Change every 30s</Chip>
        <Chip active={words.speed === 60} onClick={() => setWords({ speed: 60 })}>Every 60s</Chip>
      </div>

      <label className="mt-4 block">
        <span className="mx-0.5 mb-1.5 block text-xs text-ink-soft">Your name (optional, for a personal touch)</span>
        <input
          type="text" maxLength={24} value={words.name} onChange={e => setWords({ name: e.target.value.slice(0, 24) })}
          placeholder="e.g. Jd" autoComplete="off" spellCheck={false}
          className={fieldClass}
        />
      </label>
      <label className="mt-3 block">
        <span className="mx-0.5 mb-1.5 block text-xs text-ink-soft">Your own lines, one per row</span>
        <textarea
          rows={3} maxLength={6000} value={words.mine} onChange={e => setWords({ mine: e.target.value.slice(0, 6000) })}
          placeholder="Paste a poem line, a prayer, or a note to yourself…"
          className={cn(fieldClass, 'h-auto min-h-[76px] resize-y py-2.5 font-sans leading-normal')}
        />
      </label>
    </>
  );
}

