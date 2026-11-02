// The session controller. One focus timer, one sound system, one words system.
// Starting the timer starts whatever sound is chosen (ambient or music), and pausing or
// finishing stops it. The React components only read the store and call these functions.

import { ambient } from '../audio/ambient';
import { suspendCtx } from '../audio/context';
import {
  bell, droneSetVolume, droneStart, droneStop, fileFade, fileProgress, fileStart, filePause, filePlay,
  hooks, setDroneKey, ytEnsure, ytFade, ytLoad, ytPause, ytPlay,
} from '../audio/music';
import { MOODS } from '../data/moods';
import type { Prahar } from '../data/palettes';
import { ALL_PALETTE_IDS, praharNow } from '../data/palettes';
import { RAAG_TRACKS, TIME_LABEL } from '../data/tracks';
import type { Phase } from '../data/words';
import { CALM, PERSONAL, POEMS } from '../data/words';
import { getState, persist, persistKeys, setState } from '../lib/store';
import type { Line, MusicMode, SavedTrack, Source, Stats, State, Words } from '../lib/store';
import { load, save } from '../lib/storage';
import { dayKey, pick, wait, ytId } from '../lib/util';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F'];
const MESSAGES = ['Breathe. Focus.', 'One thing at a time', 'Slow is smooth', 'Stay with it', 'Gently, steadily'];

export interface Track {
  key: string;
  title: string;
  kind: 'file' | 'yt';
  src: string;
  time?: Prahar;
  origin: 'fixed' | 'saved' | 'session';
}

// ---------- tracks ----------

const FIXED: Track[] = RAAG_TRACKS.flatMap((t, i): Track[] => {
  const src = t.file ?? ytId(t.youtube ?? '');
  return src ? [{ key: 'c' + i, title: t.title || 'Untitled', kind: t.file ? 'file' : 'yt', src, time: t.time, origin: 'fixed' }] : [];
});

// Cached on the state arrays it is built from, so components can select from it
// without the store seeing a new object on every read.
let memo: { saved: State['saved']; files: State['files']; list: Track[] } | null = null;

export function allTracks(s: State = getState()): Track[] {
  if (memo && memo.saved === s.saved && memo.files === s.files) return memo.list;
  const list: Track[] = [
    ...FIXED,
    ...s.saved.map((t: SavedTrack): Track => ({ key: 'y' + t.id, title: t.title, kind: 'yt', src: t.yt, time: t.time, origin: 'saved' })),
    ...s.files.map((f): Track => ({ key: f.key, title: f.title, kind: 'file', src: f.src, origin: 'session' })),
  ];
  memo = { saved: s.saved, files: s.files, list };
  return list;
}

export function trackLabel(t: Track): string {
  const base = t.kind === 'yt' ? 'YouTube' : t.origin === 'session' ? 'This visit' : 'Your audio';
  return [base, t.time ? TIME_LABEL[t.time] : ''].filter(Boolean).join(' · ');
}

// ---------- module state ----------

let cur: Track | null = null;    // the track the music engine is on
let musicOn = false;            // the session is sounding the music source right now
let switchTok = 0;
let fadingOut = false;
let endAt = 0;
let tickIv = 0;
let msgIdx = 0;
let previewTimer = 0;
let toastId = 0;
let toastTimer = 0;
let zenTimer = 0;
let wordsTimer = 0;
let gen = 0;                    // invalidates pending "suspend the audio clock" timers
let phaseShown = new Set<Phase>();
let recent: string[] = [];

// ---------- helpers ----------

const isRemote = (src: string) => /^https?:\/\//i.test(src) && !src.startsWith(location.origin);
const durationMs = () => getState().minutes * 60000;

export function toast(msg: string) {
  const id = ++toastId;
  setState({ toast: { msg, id } });
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (getState().toast?.id === id) setState({ toast: null });
  }, 2600);
}

function setStatus(status: string) {
  setState({ status });
}

/** Suspend the audio clock after `ms`, unless something started again in the meantime. */
function idleSoon(ms: number) {
  const g = ++gen;
  setTimeout(() => {
    if (g !== gen || musicOn || ambient.playing || getState().timer === 'running') return;
    suspendCtx();
  }, ms);
}

// ---------- wake lock, zen, visibility ----------

let wakeLock: WakeLockSentinel | null = null;

async function keepAwake(on: boolean) {
  try {
    if (on && 'wakeLock' in navigator) {
      if (!wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      }
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    /* wake lock is a nicety */
  }
}

function scheduleZen() {
  clearTimeout(zenTimer);
  zenTimer = window.setTimeout(() => {
    const s = getState();
    if (s.timer === 'running' && !s.sheet) setState({ zen: true });
  }, 4000);
}

/** Any pointer or key activity brings the controls back. */
export function wake() {
  if (getState().zen) setState({ zen: false });
  if (getState().timer === 'running' && !getState().sheet) scheduleZen();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && getState().timer === 'running') {
    keepAwake(true);
    tick();
  }
});

// ---------- the sound ----------

function musicResume() {
  const all = allTracks();
  if (cur && all.some(t => t.key === cur!.key)) {
    if (cur.kind === 'file') {
      filePlay().then(() => fileFade(getState().musicVol, 2));
    } else {
      setState({ ytOn: true });
      ytEnsure().catch(() => undefined).then(() => { ytPlay(); ytFade(Math.round(getState().musicVol * 100), 2500); });
    }
    return;
  }
  const last = load<string | null>(persistKeys.lastTrack, null);
  playTrack(all.find(t => t.key === last) ?? firstTrack());
}

function firstTrack(): Track | null {
  const all = allTracks(), p = praharNow();
  return all.find(t => t.time === p) ?? all[0] ?? null;
}

function pickNext(dir = 1): Track | null {
  const all = allTracks();
  if (!all.length) return null;
  const i = cur ? all.findIndex(t => t.key === cur!.key) : -1;
  const mode = getState().musicMode;
  if (mode === 'one' && cur && dir === 1 && i >= 0) return all[i];
  if (mode === 'shuffle' && all.length > 1) {
    let j: number;
    do { j = (Math.random() * all.length) | 0; } while (j === i);
    return all[j];
  }
  return all[((i < 0 ? (dir > 0 ? -1 : 0) : i) + dir + all.length) % all.length];
}

async function stopCurrent(sec = .6) {
  if (!cur) return;
  if (cur.kind === 'file') {
    fileFade(0, sec);
    await wait(sec * 1000 + 60);
    filePause();
  } else {
    await ytFade(0, sec * 1000);
    ytPause();
  }
}

async function startTrack(t: Track) {
  cur = t; fadingOut = false;
  setState({ musicKey: t.key });
  save(persistKeys.lastTrack, t.key);
  if (t.kind === 'file') {
    setState({ ytOn: false });
    try {
      await fileStart(t.src, isRemote(t.src));
    } catch {
      toast('Couldn’t play that file');
      return;
    }
    fileFade(getState().musicVol, 3);
  } else {
    setState({ ytOn: true });
    try {
      await ytEnsure();
    } catch {
      toast('YouTube couldn’t load. Check your connection.');
      setState({ ytOn: false });
      return;
    }
    if (cur !== t) return;
    ytLoad(t.src);
    ytFade(Math.round(getState().musicVol * 100), 3500);
  }
}

async function playTrack(t: Track | null) {
  if (!t) return;
  const tok = ++switchTok;
  if (cur && cur.key !== t.key) await stopCurrent(.6);
  if (tok !== switchTok) return;
  await startTrack(t);
}

function skipSoon() {
  setTimeout(() => { if (musicOn) playTrack(pickNext(1)); }, 1500);
}

async function musicPause(sec = .9) {
  if (!cur) return;
  const tok = ++switchTok;
  if (cur.kind === 'file') {
    fileFade(0, sec);
    await wait(sec * 1000 + 60);
    if (tok === switchTok && !musicOn) filePause();
  } else {
    await ytFade(0, sec * 1000);
    if (tok === switchTok && !musicOn) ytPause();
  }
}

hooks.time = () => {
  if (!musicOn || fadingOut || !cur || cur.kind !== 'file') return;
  const { current, duration } = fileProgress();
  if (!isFinite(duration) || duration < 12) return;
  const left = duration - current;
  if (left < 4.5) {
    fadingOut = true;
    fileFade(0, Math.max(.5, left - .2));
  }
};
hooks.ended = () => {
  if (!musicOn) return;
  if (getState().musicMode === 'one' && cur) {
    const t = cur;
    cur = null;
    playTrack(t);
  } else {
    playTrack(pickNext(1));
  }
};
hooks.error = () => {
  if (!musicOn || !cur) return;
  toast(cur.kind === 'file' ? 'Couldn’t play that file' : 'That YouTube video can’t be played here');
  skipSoon();
};

/** Start the chosen sound (the session has started, or the source was switched while running). */
function soundStart() {
  const s = getState();
  if (!s.soundOn) return;
  gen++;
  if (s.source === 'ambient') {
    ambient.play(s.ambientVol, s.mood);
  } else {
    musicOn = true;
    if (!allTracks().length && !s.drone) setDrone(true, true);
    musicResume();
  }
  if (getState().drone) droneStart(getState().droneVol);
}

/** Stop everything that sounds, fading out over `fade` seconds. */
function soundStop(fade = .8) {
  musicOn = false;
  ambient.stop(fade);
  if (cur) musicPause(fade);
  droneStop(fade + .5);
  idleSoon(fade * 1000 + 400);
}

export function setSoundOn(on: boolean) {
  persist('soundOn', on);
  setState({ soundOn: on });
  if (getState().timer === 'running') {
    if (on) soundStart(); else soundStop();
  } else if (!on) {
    endPreview();
  }
}

export function setSource(source: Source) {
  if (source === getState().source) return;
  const running = getState().timer === 'running';
  if (running) soundStop(.5);
  persist('source', source);
  setState({ source });
  if (running) soundStart();
}

export function setMood(id: string, withPreview: boolean) {
  ambient.setMood(id);
  persist('mood', id);
  setState({ mood: id });
  if (withPreview) preview();
}

/** A short taste of a mood while the timer is idle. */
function preview() {
  const s = getState();
  if (s.timer === 'running' || !s.soundOn || s.source !== 'ambient') return;
  ambient.play(s.ambientVol, s.mood);
  clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    previewTimer = 0;
    if (getState().timer !== 'running') ambient.stop(2.5);
  }, 12000);
}

function endPreview() {
  if (!previewTimer) return;
  clearTimeout(previewTimer);
  previewTimer = 0;
  if (getState().timer !== 'running') ambient.stop(1.5);
}

/** The card's volume slider: changes the volume of whichever source is active. */
export function setVolume(v: number) {
  if (getState().source === 'ambient') {
    persist('ambientVol', v);
    setState({ ambientVol: v });
    ambient.setVolume(v);
  } else {
    setMusicVolume(v);
  }
}

export function setMusicVolume(v: number) {
  persist('musicVol', v);
  setState({ musicVol: v });
  if (musicOn && cur) {
    if (cur.kind === 'file') { if (!fadingOut) fileFade(v, .15); }
    else ytFade(Math.round(v * 100), 150);
  }
}

export function setDroneVolume(v: number) {
  persist('droneVol', v);
  setState({ droneVol: v });
  droneSetVolume(v);
}

export function setDrone(on: boolean, quiet = false) {
  persist('drone', on);
  setState({ drone: on });
  if (getState().timer === 'running' && getState().soundOn) {
    if (on) droneStart(getState().droneVol); else droneStop();
  }
  if (!quiet) toast(on ? `Tanpura on · Sa ${KEYS[getState().droneKey]}` : 'Tanpura off');
}

export function toggleDrone() {
  setDrone(!getState().drone);
}

export function setDroneKeyIndex(k: number) {
  persist('droneKey', k);
  setDroneKey(k);
  setState({ droneKey: k });
  if (getState().drone && getState().timer === 'running' && getState().soundOn) {
    droneStop(1.2);
    setTimeout(() => {
      if (getState().timer === 'running' && getState().drone && getState().soundOn) droneStart(getState().droneVol);
    }, 1300);
  }
}

export function setMusicMode(mode: MusicMode) {
  persist('musicMode', mode);
  setState({ musicMode: mode });
}

/** Previous or next: the next mood in ambient, the next track in music. */
export function step(dir: 1 | -1) {
  const s = getState();
  if (s.source === 'ambient') {
    const i = MOODS.findIndex(m => m.id === s.mood);
    const next = MOODS[(i + dir + MOODS.length) % MOODS.length];
    setMood(next.id, true);
    return;
  }
  const t = pickNext(dir);
  if (!t) return toast('Add some music first');
  playOrStart(t);
}

/** Tap a track: play it now, starting the session if it is idle. */
export function selectTrack(key: string) {
  const t = allTracks().find(x => x.key === key);
  if (!t) return;
  if (getState().source !== 'music') setSource('music');
  if (!getState().soundOn) setSoundOn(true);
  playOrStart(t);
}

function playOrStart(t: Track) {
  if (getState().timer === 'running') {
    playTrack(t);
  } else {
    cur = null;
    save(persistKeys.lastTrack, t.key);
    start();
  }
}

export function removeTrack(key: string) {
  const s = getState();
  if (key[0] === 'y') {
    const saved = s.saved.filter(t => 'y' + t.id !== key);
    persist('saved', saved);
    setState({ saved });
  } else {
    const f = s.files.find(x => x.key === key);
    if (f) URL.revokeObjectURL(f.src);
    setState({ files: s.files.filter(x => x.key !== key) });
  }
  if (cur && cur.key === key) {
    const was = musicOn;
    stopCurrent(.5);
    cur = null;
    setState({ ytOn: false, musicKey: null });
    if (was) playTrack(pickNext(1));
  }
}

/** Returns false when the link is not a YouTube link, so the form keeps what was typed. */
export function addYouTube(url: string, title: string, time: Prahar | undefined): boolean {
  const id = ytId(url);
  if (!id) {
    toast('That doesn’t look like a YouTube link');
    return false;
  }
  const saved = [...getState().saved, { id: Date.now().toString(36), yt: id, title: title.trim() || 'YouTube track', time }];
  persist('saved', saved);
  setState({ saved });
  toast('Added to your playlist');
  return true;
}

export function addFiles(list: FileList) {
  const files = [...list].map(file => ({
    key: 's' + Math.random().toString(36).slice(2, 8),
    title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
    src: URL.createObjectURL(file),
  }));
  setState({ files: [...getState().files, ...files] });
  if (files.length) toast(`${files.length} file${files.length > 1 ? 's' : ''} added for this visit`);
}

// ---------- the focus timer ----------

export function start() {
  const s = getState();
  if (s.timer === 'running') return;
  clearTimeout(previewTimer);
  previewTimer = 0;
  if (s.timer === 'idle' || s.timer === 'done') phaseShown = new Set();
  const remaining = s.timer === 'done' ? durationMs() : s.remaining;
  endAt = Date.now() + remaining;
  msgIdx = Math.floor((durationMs() - remaining) / 120000);
  setState({ timer: 'running', remaining, zen: false, status: MESSAGES[msgIdx % MESSAGES.length] });
  clearInterval(tickIv);
  if (s.minutes) tickIv = window.setInterval(tick, 250);
  soundStart();
  keepAwake(true);
  scheduleZen();
  if (s.timer !== 'paused') nextLine(true);
}

export function pause() {
  const s = getState();
  if (s.timer !== 'running') return;
  clearInterval(tickIv);
  const remaining = s.minutes ? Math.max(0, endAt - Date.now()) : 0;
  setState({ timer: 'paused', remaining, status: 'Paused' });
  soundStop();
  keepAwake(false);
  wake();
}

export function toggleSession() {
  if (getState().timer === 'running') pause(); else start();
}

export function reset() {
  clearInterval(tickIv);
  soundStop();
  phaseShown = new Set();
  setState({ timer: 'idle', remaining: durationMs(), status: 'Ready when you are', zen: false });
  keepAwake(false);
  wake();
  if (getState().words.mode === 'corner') nextLine(true);
}

export function setMinutes(min: number) {
  const m = Math.min(180, Math.max(0, Math.round(min)));
  persist('minutes', m);
  setState({ minutes: m });
  reset();
}

function tick() {
  const s = getState();
  if (s.timer !== 'running') return;
  const remaining = endAt - Date.now();
  if (remaining <= 0) return finish();
  const m = Math.floor((durationMs() - remaining) / 120000);
  if (m !== msgIdx) {
    msgIdx = m;
    setStatus(MESSAGES[m % MESSAGES.length]);
  }
  setState({ remaining });
}

function finish() {
  clearInterval(tickIv);
  const min = Math.round(durationMs() / 60000);
  const source = getState().source;
  soundStop(6);
  if (source === 'ambient') ambient.chime(); else bell();
  try { navigator.vibrate?.([180, 120, 180]); } catch { /* not supported */ }
  const n = logSession(min);
  setState({ timer: 'done', remaining: 0, status: n > 1 ? `Session ${n} today · take a breath` : 'Time’s up · take a breath', zen: false });
  keepAwake(false);
  refreshStats();
  nextLine(true);
}

export function currentPhase(s: State): Phase | null {
  if (s.timer === 'done') return 'done';
  if (s.timer !== 'running' || !s.minutes) return null;
  const dur = durationMs(), el = dur - s.remaining, f = el / dur;
  if (f < .1) return 'start';
  if (s.remaining <= Math.min(180000, dur * .2)) return 'end';
  if (f > .45 && f < .62) return 'mid';
  return null;
}

// ---------- the sheet ----------

export function setSheet(open: boolean) {
  if (open) {
    refreshStats();
    clearTimeout(zenTimer);
    setState({ sheet: true, zen: false });
  } else {
    endPreview();
    setState({ sheet: false });
    if (getState().timer === 'running') scheduleZen();
  }
}

export function cyclePalette() {
  const i = ALL_PALETTE_IDS.indexOf(getState().palette);
  setPalette(ALL_PALETTE_IDS[(i + 1) % ALL_PALETTE_IDS.length]);
}

export function setPalette(id: string) {
  persist('palette', id);
  setState({ palette: id });
}

export function setRaagMode(mode: State['raagMode']) {
  persist('raagMode', mode);
  setState({ raagMode: mode });
  toast(mode === 'auto' ? 'Following the raga clock' : mode === 'light' ? 'Day light' : 'Night light');
}

export function setPrahar() {
  const p = praharNow();
  if (p !== getState().prahar) setState({ prahar: p });
}

export function setIntent(v: string) {
  const intent = v.slice(0, 60);
  persist('intent', intent);
  setState({ intent });
}

export function setWords(patch: Partial<Words>) {
  const words = { ...getState().words, ...patch };
  persist('words', words);
  setState({ words });
  recent = [];
}

export function setWordsMode(mode: Words['mode']) {
  setWords({ mode });
  if (mode === 'corner') nextLine(true);
  else {
    clearTimeout(wordsTimer);
    setState({ lineShown: false });
  }
}

// ---------- words ----------

function fillName(s: string) {
  return s.replace(/\{n\}/g, getState().words.name.trim());
}

function pickLine(): Line {
  const s = getState(), w = s.words, ph = currentPhase(s), name = w.name.trim();
  if (ph && !phaseShown.has(ph) && w.calm) {
    phaseShown.add(ph);
    const src = name && Math.random() < .6 ? PERSONAL[ph] : CALM[ph];
    return { text: fillName(pick(src)) };
  }
  const mine = w.mine.split('\n').map(x => x.trim()).filter(Boolean);
  const pools: [number, readonly unknown[], 'calm' | 'personal' | 'poem' | 'mine'][] = [];
  if (w.calm) {
    pools.push([name ? 2 : 3, CALM.any, 'calm']);
    if (name) pools.push([1.6, PERSONAL.any, 'personal']);
  }
  if (w.poems) pools.push([w.calm ? (name ? 3.6 : 3) : 3, POEMS, 'poem']);
  if (mine.length) pools.push([pools.length ? 1.2 : 3, mine, 'mine']);
  if (!pools.length) pools.push([1, CALM.any, 'calm']);

  const total = pools.reduce((a, p) => a + p[0], 0);
  let r = Math.random() * total;
  let pool = pools[0];
  for (const p of pools) { if ((r -= p[0]) <= 0) { pool = p; break; } }

  let item: unknown, key = '';
  for (let i = 0; i < 12; i++) {
    item = pick(pool[1]);
    key = typeof item === 'string' ? item : (item as { text: string }).text;
    if (!recent.includes(key) || pool[1].length <= 1) break;
  }
  recent.push(key);
  if (recent.length > 30) recent.shift();

  if (pool[2] === 'poem') {
    const p = item as { text: string; mean: string; by: string };
    return { text: p.text, mean: p.mean, by: p.by, poem: true };
  }
  return { text: fillName(String(typeof item === 'string' ? item : (item as { text: string }).text)) };
}

/** Show the next line, after the current one has faded. */
export function nextLine(soon = false) {
  clearTimeout(wordsTimer);
  if (getState().words.mode !== 'corner') return;
  const wasShown = getState().lineShown;
  setState({ lineShown: false });
  const delay = wasShown ? 2700 : soon ? 400 : 50;
  wordsTimer = window.setTimeout(() => {
    const s = getState();
    if (s.words.mode !== 'corner') return;
    setState({ line: pickLine(), lineShown: true });
    wordsTimer = window.setTimeout(() => nextLine(false), s.words.speed * 1000);
  }, delay);
}

// ---------- stats ----------

type Log = Record<string, { min: number; n: number }>;

function logSession(min: number): number {
  const log = load<Log>('drift:log', {}), k = dayKey();
  log[k] = log[k] ?? { min: 0, n: 0 };
  log[k].min += min;
  log[k].n += 1;
  const keys = Object.keys(log).sort();
  while (keys.length > 120) delete log[keys.shift()!];
  save('drift:log', log);
  return log[k].n;
}

export function refreshStats() {
  const log = load<Log>('drift:log', {}), todayLog = log[dayKey()] ?? { min: 0, n: 0 };
  let week = 0, streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    week += log[dayKey(d)]?.min ?? 0;
  }
  for (let i = todayLog.n ? 0 : 1; i < 400; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (log[dayKey(d)]?.n) streak++; else break;
  }
  const stats: Stats = { today: todayLog, week, streak };
  setState({ stats });
}

/** Minutes as the stats card shows them: 45m, 2h 5m. */
export const hm = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + 'm' : ''}`.trim() : `${m}m`);

// ---------- start-up ----------

export function boot() {
  setDroneKey(getState().droneKey);
  setState({ prahar: praharNow() });
  refreshStats();
  if (getState().words.mode === 'corner') nextLine(true);
}
