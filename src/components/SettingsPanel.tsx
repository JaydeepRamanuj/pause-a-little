import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { canInstall, install, subscribeInstall } from '../lib/pwa';
import { LANGS } from '../data/words';
import {
  allTracks, applySetup, cancelSleep, deleteSetup, setLayer, startSleep, hm, notifyPermission, saveSetup, setClock, setCycle, setNotify, setGoal, setHistory, setClean, setCleanClock, setDroneKeyIndex, setMandalaSpin, setDroneVolume, setSheet,
  setShapeStyle, setSongVisual, setWords, toggleDrone, toggleLang,
} from '../app/session';
import { MANDALA_SPINS, useStore } from '../lib/store';
import type { ShapeStyle } from '../lib/store';
import { cn } from '../lib/cn';
import { Chip } from './Focus';
import { BREATHS } from '../app/breathMath';
import { LAYER_IDS, LAYER_NAMES, SLEEP_MINUTES, sleepLeft } from '../app/layersMath';
import { raagInfoFor } from '../data/raags';
import { Heading, Slider, fieldClass } from './controls';
import { CALM_VISUALS } from './calmArt';
import { CloseIcon } from './icons';
import { DataSection } from './History';

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
          <AppSection />
          <WordsSection />
          <FocusSection />
          <CycleSection />
          <LayerSection />
          <SleepSection />
          <SetupSection />
          <NotifySection />
          <DataSection />

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

/** Install to the home screen, when the browser offers it. */
function AppSection() {
  const [can, setCan] = useState(canInstall());
  useEffect(() => subscribeInstall(() => setCan(canInstall())), []);
  if (!can) return null;
  return (
    <>
      <Heading>App</Heading>
      <button type="button" onClick={install} className="glass h-10 rounded-full px-4 text-[13px] hover:bg-glass-strong">
        Install pause a little
      </button>
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
        Installed, it opens in its own window and keeps working offline. Songs and YouTube still need a connection.
      </p>
    </>
  );
}

function ScreenSection() {
  const clean = useStore(s => s.clean);
  const cleanClock = useStore(s => s.cleanClock);
  const spinSpeed = useStore(s => s.mandalaSpin);
  return (
    <>
      <Heading>Screen</Heading>
      <div className="flex flex-wrap gap-2">
        <Chip active={clean} onClick={() => setClean(!clean)}>Clean screen</Chip>
        <Chip active={cleanClock} onClick={() => setCleanClock(!cleanClock)}>Clock in clean screen</Chip>
      </div>
      <p className="mx-0.5 mt-3 text-[11.5px] leading-relaxed text-ink-soft">
        Clean screen hides every control. Move the mouse or press a key to bring them back for a few seconds. Press X to toggle it.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip active={false} onClick={() => setClock(true)}>Clock only (T)</Chip>
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[.2em] text-ink-soft">Mandala spin</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MANDALA_SPINS.map(m => (
          <Chip key={m.id} active={spinSpeed === m.id} onClick={() => setMandalaSpin(m.id)}>{m.label}</Chip>
        ))}
      </div>
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
        How fast the rings of the Raag mandala turn. It eases still when you pause.
      </p>
    </>
  );
}

// ---------- layer mixer and sleep timer ----------

function LayerSection() {
  const levels = useStore(s => s.layers);
  return (
    <>
      <Heading>Sound layers</Heading>
      <p className="mx-0.5 mb-2 text-[11.5px] leading-relaxed text-ink-soft">
        Mix a little rain, ocean, bells, pads or tanpura under whatever plays. Each has its own volume; leave it at zero to switch it off.
      </p>
      <div className="flex flex-col gap-1">
        {LAYER_IDS.map(id => (
          <Slider key={id} label={LAYER_NAMES[id]} value={levels[id]} onChange={v => setLayer(id, v)} />
        ))}
      </div>
    </>
  );
}

function SleepSection() {
  const end = useStore(s => s.sleepEnd);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!end) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [end]);
  return (
    <>
      <Heading>Sleep timer</Heading>
      <div className="flex flex-wrap items-center gap-2">
        {SLEEP_MINUTES.map(m => (
          <Chip key={m} active={false} onClick={() => startSleep(m)}>{m} min</Chip>
        ))}
        {end && <Chip active onClick={cancelSleep}>{sleepLeft(end, now)} · Cancel</Chip>}
      </div>
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
        Plays your sound and fades it out slowly at the end. It works without a focus session.
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
  const track = useStore(s => allTracks(s).find(t => t.key === s.musicKey) ?? null);
  const info = track ? raagInfoFor(track.title) : null;
  return (
    <>
      {info && (
        <>
          <Heading>About this raag</Heading>
          <div className="glass rounded-2xl px-4 py-3 text-[13px] leading-relaxed">
            <b className="font-normal">Raag {info.name}</b>
            <dl className="mt-1.5 grid grid-cols-[5.5rem_1fr] gap-y-0.5 text-[12.5px] text-ink-soft">
              <dt>Thaat</dt><dd className="text-ink">{info.thaat}</dd>
              <dt>Prahar</dt><dd className="text-ink">{info.hour}</dd>
              <dt>Mood</dt><dd className="text-ink">{info.mood}</dd>
            </dl>
          </div>
        </>
      )}
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
  const goal = useStore(s => s.goal);
  return (
    <>
      <Heading>Your focus</Heading>
      <div className="grid grid-cols-3 gap-2">
        <StatCard value={hm(stats.today.min)} label="Today" />
        <StatCard value={hm(stats.week)} label="This week" />
        <StatCard value={String(stats.streak)} label="Day streak" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-ink-soft">Daily goal</span>
        {[0, 30, 60, 120, 180, 240].map(m => (
          <Chip key={m} active={goal === m} onClick={() => setGoal(m)}>{m ? hm(m) : 'Off'}</Chip>
        ))}
      </div>
      <button type="button" onClick={() => setHistory(true)} className="glass mt-3 h-10 rounded-full px-4 text-[13px] hover:bg-glass-strong">
        Open history (H)
      </button>
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


// ---------- focus and break cycles ----------

function CycleSection() {
  const c = useStore(s => s.cycle);
  const minutes = useStore(s => s.minutes);
  const breath = BREATHS.find(b => b.id === c.breathing);
  return (
    <>
      <Heading>Focus &amp; breaks</Heading>
      <div className="flex flex-wrap gap-2">
        <Chip active={c.on} onClick={() => setCycle({ on: !c.on })}>{c.on ? 'Cycles on' : 'Cycles off'}</Chip>
      </div>
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
        {c.on
          ? `Focus (${minutes || '—'} min, set on the timer), then a short break, with a long break every ${c.every}th round. Reset starts the cycle again.`
          : 'Off: one plain timer, like a single sitting.'}
      </p>
      {c.on && (
        <>
          <Row label="Short break">
            {[3, 5, 10].map(m => <Chip key={m} active={c.shortMin === m} onClick={() => setCycle({ shortMin: m })}>{m}m</Chip>)}
          </Row>
          <Row label="Long break">
            {[10, 15, 20, 30].map(m => <Chip key={m} active={c.longMin === m} onClick={() => setCycle({ longMin: m })}>{m}m</Chip>)}
          </Row>
          <Row label="Long break every">
            {[3, 4, 5, 6].map(n => <Chip key={n} active={c.every === n} onClick={() => setCycle({ every: n })}>{n}</Chip>)}
          </Row>
          <Row label="Breathing on breaks">
            {BREATHS.map(b => <Chip key={b.id} active={c.breathing === b.id} onClick={() => setCycle({ breathing: b.id })}>{b.label}</Chip>)}
            <Chip active={c.breathing === 'off'} onClick={() => setCycle({ breathing: 'off' })}>Off</Chip>
          </Row>
          {breath && <p className="mx-0.5 mt-2 text-[11.5px] text-ink-soft">{breath.hint}. The ring and the mandala grow and shrink with the breath.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip active={c.auto} onClick={() => setCycle({ auto: !c.auto })}>Start next automatically</Chip>
            <Chip active={c.lookBack} onClick={() => setCycle({ lookBack: !c.lookBack })}>Look-back after focus</Chip>
          </div>
          <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
            Breaks use a softer palette, and a lighter sound: the tanpura alone for Raag, an open ambient mood otherwise. Press B to skip a break.
          </p>
        </>
      )}
    </>
  );
}

// ---------- saved setups ----------

function SetupSection() {
  const setups = useStore(s => s.setups);
  const [name, setName] = useState('');
  const save = () => {
    if (!name.trim()) return;
    saveSetup(name);
    setName('');
  };
  return (
    <>
      <Heading>Saved setups</Heading>
      {setups.length === 0 && (
        <p className="mx-0.5 mb-2 text-[11.5px] leading-relaxed text-ink-soft">
          Keep the time, breaks, sound, colours, mandala and words together under a name, like “Deep work” or “Evening riyaz”.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {setups.map(u => (
          <li key={u.id} className="glass flex items-center gap-2 rounded-2xl py-1.5 pl-4 pr-1.5">
            <span className="min-w-0 flex-1 truncate text-[13px]">
              {u.name}
              <span className="ml-2 text-[11.5px] text-ink-soft">{u.minutes ? `${u.minutes}m` : '∞'} · {u.source === 'songs' ? 'songs' : u.source}</span>
            </span>
            <button type="button" onClick={() => applySetup(u.id)} className="h-8 rounded-full bg-ink px-3.5 text-[12.5px] text-bg">Use</button>
            <button type="button" aria-label={`Delete ${u.name}`} onClick={() => deleteSetup(u.id)} className="grid size-8 place-items-center rounded-full text-ink-soft hover:bg-glass-strong">
              <CloseIcon className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          type="text" value={name} maxLength={24} placeholder="Name for the current settings"
          aria-label="Setup name" autoComplete="off"
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); }}
          className={fieldClass}
        />
        <button type="button" onClick={save} disabled={!name.trim()} className="glass h-10 shrink-0 rounded-full px-4 text-[13px] hover:bg-glass-strong disabled:opacity-40">Save</button>
      </div>
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
        Using a setup resets the timer (a long enough session so far is still logged) and starts nothing. Saving under an existing name replaces it.
      </p>
    </>
  );
}

// ---------- notification ----------

function NotifySection() {
  const on = useStore(s => s.notify);
  const perm = notifyPermission();
  if (perm === 'unsupported') return null;
  return (
    <>
      <Heading>When a session ends</Heading>
      <div className="flex flex-wrap gap-2">
        <Chip active={on} onClick={() => setNotify(!on)}>{on ? 'Notify me' : 'Notifications off'}</Chip>
      </div>
      <p className="mx-0.5 mt-2 text-[11.5px] leading-relaxed text-ink-soft">
        {perm === 'denied'
          ? 'The browser has blocked notifications for this site. Allow them in the site settings to hear about the end of a session while you are in another tab.'
          : 'A quiet note when a session or break ends while this tab is hidden. The browser asks the first time you start a session.'}
      </p>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <p className="mx-0.5 mb-1.5 text-xs text-ink-soft">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
