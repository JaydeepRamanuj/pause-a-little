import { useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { FOCUS_PALETTES, RAAG_CLOCK_ID, resolvePalette, type Palette, type Prahar, type RaagClockMode } from '../data/palettes';
import { MOODS } from '../data/moods';
import { TIME_LABEL } from '../data/tracks';
import {
  addFiles, addYouTube, allTracks, hm, removeTrack, selectTrack, setDroneKeyIndex, setDroneVolume,
  setMinutes, setMood, setMusicMode, setMusicVolume, setPalette, setRaagMode, setSheet, setSource, setVolume,
  setWords, setWordsMode, toggleDrone, trackLabel, type Track,
} from '../app/session';
import { useStore } from '../lib/store';
import type { MusicMode, Source, Words } from '../lib/store';
import { cn } from '../lib/cn';
import { Chip } from './Focus';
import { CloseIcon, UploadIcon } from './icons';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F'];
const DURATIONS = [10, 15, 20, 25, 45, 60];

/** The sheet: colours, sound, focus length and the motivation corner. */
export function Sheet() {
  const open = useStore(s => s.sheet);
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
        aria-label="Atmosphere"
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 24 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-10 max-h-[min(80dvh,720px)] w-[min(560px,calc(100vw_-_24px))] -translate-x-1/2 overflow-auto overscroll-contain rounded-3xl border border-glass-border bg-sheet px-[18px] pb-[18px] pt-5 shadow-[0_20px_60px_rgba(0,0,0,.18)] backdrop-blur-[24px] backdrop-saturate-[1.3]"
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 font-display text-[22px] font-normal">Atmosphere</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheet(false)}
            className="glass grid size-9 place-items-center rounded-full hover:bg-glass-strong"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <ColorsSection />
        <SoundSection />
        <FocusSection />
        <WordsSection />
      </motion.section>
    </>
  );
}

const Heading = ({ children }: { children: ReactNode }) => (
  <h3 className="mx-0.5 mb-2.5 mt-[22px] text-[11.5px] font-medium uppercase tracking-[.16em] text-ink-soft">{children}</h3>
);

function Seg<T extends string>({ options, value, onChange, className }: {
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

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
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

// ---------- colours ----------

function Orb({ colors, bg }: { colors: string[]; bg: string }) {
  const background = `radial-gradient(circle at 30% 30%, ${colors[0]}, transparent 62%), radial-gradient(circle at 72% 55%, ${colors[2]}, transparent 60%), radial-gradient(circle at 40% 82%, ${colors[3]}, transparent 60%), ${bg}`;
  return <span className="block size-[46px] rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.25)]" style={{ background }} />;
}

function ColorsSection() {
  const palette = useStore(s => s.palette);
  const mode = useStore(s => s.raagMode);
  const prahar = useStore(s => s.prahar);
  const clock: Palette = resolvePalette(RAAG_CLOCK_ID, mode, prahar);

  return (
    <>
      <Heading>Colors</Heading>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(78px,1fr))] gap-2.5">
        {FOCUS_PALETTES.map(p => (
          <SwatchButton key={p.id} active={palette === p.id} label={p.name} onClick={() => setPalette(p.id)}>
            <Orb colors={p.colors} bg={p.bg} />
          </SwatchButton>
        ))}
        <SwatchButton active={palette === RAAG_CLOCK_ID} label="Raag clock" onClick={() => setPalette(RAAG_CLOCK_ID)}>
          <Orb colors={clock.colors} bg={clock.bg} />
        </SwatchButton>
      </div>
      {palette === RAAG_CLOCK_ID && (
        <Seg<RaagClockMode>
          className="mt-3"
          value={mode}
          onChange={setRaagMode}
          options={[['auto', 'Clock'], ['light', 'Day'], ['dark', 'Night']]}
        />
      )}
    </>
  );
}

function SwatchButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={`${label} colors`}
      onClick={onClick}
      className="flex flex-col items-center gap-[7px] rounded-2xl px-1 py-2 text-xs transition-colors duration-300 hover:bg-glass"
    >
      <span className={cn('block rounded-full transition-shadow duration-300', active && 'shadow-[0_0_0_2px_var(--bg),0_0_0_4px_var(--ink)]')}>
        {children}
      </span>
      {label}
    </button>
  );
}

// ---------- sound ----------

function SoundSection() {
  const source = useStore(s => s.source);
  const ambientVol = useStore(s => s.ambientVol);
  const musicVol = useStore(s => s.musicVol);

  return (
    <>
      <Heading>Sound</Heading>
      <Seg<Source>
        value={source}
        onChange={setSource}
        options={[['ambient', 'Ambient'], ['music', 'Music']]}
      />
      <Slider
        label="Volume"
        value={source === 'ambient' ? ambientVol : musicVol}
        onChange={setVolume}
      />
      {source === 'ambient' ? <MoodGrid /> : <Playlist />}
      <Tanpura />
    </>
  );
}

function MoodGrid() {
  const mood = useStore(s => s.mood);
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
        {MOODS.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMood(m.id, true)}
            aria-pressed={m.id === mood}
            className={cn(
              'rounded-2xl p-3 text-left transition-colors duration-300',
              m.id === mood ? 'bg-ink text-bg' : 'glass hover:bg-glass-strong',
            )}
          >
            <b className="mb-[3px] block text-sm font-medium">{m.name}</b>
            <span className={cn('block text-xs leading-snug', m.id === mood ? 'opacity-75' : 'text-ink-soft')}>{m.desc}</span>
          </button>
        ))}
      </div>
      <p className="mx-0.5 mt-3 text-[11.5px] leading-relaxed text-ink-soft">
        Tap a sound to hear a short preview. Everything is composed live in your browser, so it never repeats. Your name and lines stay on this device only.
      </p>
    </>
  );
}

function Playlist() {
  const tracks = useStore(s => allTracks(s));
  const musicKey = useStore(s => s.musicKey);
  const timer = useStore(s => s.timer);
  const mode = useStore(s => s.musicMode);
  const prahar = useStore(s => s.prahar);

  return (
    <>
      <Heading>Playlist</Heading>
      <div className="flex flex-col gap-1.5">
        {tracks.length
          ? tracks.map(t => (
            <TrackRow
              key={t.key}
              track={t}
              current={musicKey === t.key}
              playing={timer === 'running' && musicKey === t.key}
              suits={t.time === prahar}
            />
          ))
          : <p className="px-0.5 text-[13px] text-ink-soft">No music yet. Add a YouTube link below, or turn on the tanpura.</p>}
      </div>
      <Seg<MusicMode>
        className="mt-2.5"
        value={mode}
        onChange={setMusicMode}
        options={[['order', 'In order'], ['shuffle', 'Shuffle'], ['one', 'Repeat one']]}
      />

      <AddYouTube />

      <Heading>Your own audio</Heading>
      <FilePicker />
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
        Files picked here play for this visit only. To keep songs for good, put them in the <code className="rounded-[5px] bg-glass px-1 text-[11px]">public/songs/</code> folder and list them in <code className="rounded-[5px] bg-glass px-1 text-[11px]">src/data/tracks.ts</code>.
      </p>
    </>
  );
}

function TrackRow({ track, current, playing, suits }: { track: Track; current: boolean; playing: boolean; suits: boolean }) {
  const removable = track.origin !== 'fixed';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectTrack(track.key)}
      onKeyDown={e => { if (e.key === 'Enter') selectTrack(track.key); }}
      style={current ? { borderColor: 'var(--accent)' } : undefined}
      className="glass flex w-full cursor-pointer items-center gap-2.5 rounded-2xl py-2.5 pl-3.5 pr-2.5 text-left transition-colors duration-300 hover:bg-glass-strong"
    >
      <span className="flex h-3.5 w-3.5 flex-none items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <i
            key={i}
            className={cn('h-[30%] flex-1 rounded-[1px] bg-accent', playing && 'animate-eq', !current && 'opacity-0')}
            style={playing ? { animationDelay: `${-i * 0.5}s` } : undefined}
          />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-sm font-normal">{track.title}</b>
        <span className="mt-0.5 block text-[11.5px] text-ink-soft">
          {trackLabel(track)}{suits && ' · suits now'}
        </span>
      </span>
      {removable && (
        <button
          type="button"
          aria-label="Remove"
          onClick={e => { e.stopPropagation(); removeTrack(track.key); }}
          className="grid size-[30px] flex-none place-items-center rounded-full text-ink-soft hover:bg-glass-strong hover:text-ink"
        >
          <CloseIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function AddYouTube() {
  const titleField = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const add = () => {
    if (addYouTube(url, title, (time || undefined) as Prahar | undefined)) {
      setUrl('');
      setTitle('');
    }
  };
  return (
    <>
      <Heading>Add a YouTube link</Heading>
      <div className="grid gap-2">
        <input
          type="url" value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') titleField.current?.focus(); }}
          placeholder="Paste a YouTube link" autoComplete="off" spellCheck={false} aria-label="YouTube link"
          className={fieldClass}
        />
        <div className="flex flex-nowrap gap-2">
          <input
            ref={titleField} type="text" maxLength={60} value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); }}
            placeholder="Title, e.g. Raag Yaman · Bansuri" autoComplete="off" aria-label="Title"
            className={cn(fieldClass, 'min-w-0 flex-1')}
          />
          <select
            value={time} onChange={e => setTime(e.target.value)} aria-label="Best time"
            className={cn(fieldClass, 'w-auto cursor-pointer appearance-none pr-7')}
          >
            <option value="">Any time</option>
            {(Object.keys(TIME_LABEL) as Prahar[]).map(p => <option key={p} value={p}>{TIME_LABEL[p]}</option>)}
          </select>
          <button type="button" onClick={add} className="h-10 flex-none rounded-full bg-ink px-[18px] text-[13px] text-bg">Add</button>
        </div>
      </div>
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
        YouTube tracks play in YouTube’s own small player, which stays visible while it plays.
      </p>
    </>
  );
}

const fieldClass = 'h-10 w-full rounded-[14px] border border-glass-border bg-glass px-3 text-sm text-ink outline-none placeholder:text-ink-soft';

function FilePicker() {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => input.current?.click()} className="glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] hover:bg-glass-strong">
        <UploadIcon className="size-4" />
        Play files from this device
      </button>
      <input
        ref={input} type="file" accept="audio/*" multiple hidden
        onChange={e => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </>
  );
}

function Tanpura() {
  const drone = useStore(s => s.drone);
  const droneKey = useStore(s => s.droneKey);
  const droneVol = useStore(s => s.droneVol);
  const musicVol = useStore(s => s.musicVol);
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
      <Slider label="Music" value={musicVol} onChange={setMusicVolume} />
    </>
  );
}

// ---------- focus ----------

function FocusSection() {
  const minutes = useStore(s => s.minutes);
  const stats = useStore(s => s.stats);
  return (
    <>
      <Heading>Focus length</Heading>
      <div className="flex flex-wrap gap-2">
        {DURATIONS.map(m => (
          <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>{m}m</Chip>
        ))}
        <Chip active={minutes === 0} onClick={() => setMinutes(0)}>No timer</Chip>
      </div>

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

// ---------- words ----------

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
      <Seg<Words['mode']>
        value={words.mode}
        onChange={setWordsMode}
        options={[['timer', 'Timer only'], ['corner', 'Motivation corner']]}
      />
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Chip active={words.calm} onClick={() => toggleKind('calm')}>Calm lines</Chip>
        <Chip active={words.poems} onClick={() => toggleKind('poems')}>Poems &amp; sayings</Chip>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Chip active={words.speed === 30} onClick={() => setWords({ speed: 30 })}>Change every 30s</Chip>
        <Chip active={words.speed === 60} onClick={() => setWords({ speed: 60 })}>Every 60s</Chip>
      </div>

      <label className="mt-3 block">
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
