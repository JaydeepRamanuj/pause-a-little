// The session controller. One focus timer, one sound system, one words system.
// Starting the timer starts whatever sound is chosen (ambient or music), and pausing or
// finishing stops it. The React components only read the store and call these functions.

import { ambient } from "../audio/ambient";
import { suspendCtx } from "../audio/context";
import {
  bell,
  droneSetVolume,
  droneStart,
  droneStop,
  fileFade,
  fileProgress,
  fileSeek,
  fileStart,
  filePause,
  filePlay,
  hooks,
  setDroneKey,
  ytEnsure,
  ytFade,
  ytLoad,
  ytLoadAt,
  ytPause,
  ytPlay,
} from "../audio/music";
import { MOODS } from "../data/moods";
import type { Prahar } from "../data/palettes";
import { ALL_PALETTE_IDS, praharNow } from "../data/palettes";
import {
  SONGS_COLLECTIONS,
  RAAG_TRACKS,
  TIME_LABEL,
  type Chapter,
} from "../data/tracks";
import type { Phase } from "../data/words";
import {
  CALM,
  PERSONAL,
  POEMS,
  poemLang,
  type Lang,
} from "../data/words";
import { getState, persist, persistKeys, setState } from "../lib/store";
import type { MandalaId } from "../components/mandalas";
import type { CalmVisualId } from "../components/calmArt";
import type {
  Line,
  MusicMode,
  Picker,
  SavedTrack,
  ShapeStyle,
  Source,
  Stats,
  State,
  Words,
  View,
} from "../lib/store";
import { load, save } from "../lib/storage";
import { dayKey, pick, wait, ytId } from "../lib/util";

const KEYS = ["C", "C#", "D", "D#", "E", "F"];
/** How long a sound type takes to fade out (and the next to fade in), in seconds. */
const SWITCH_FADE = 3;
/** The atmosphere under calm songs, relative to the ambient volume. */
const MESSAGES = [
  "Breathe. Focus.",
  "One thing at a time",
  "Slow is smooth",
  "Stay with it",
  "Gently, steadily",
];

export interface Track {
  key: string;
  title: string;
  kind: "file" | "yt";
  src: string;
  time?: Prahar;
  origin: "fixed" | "saved" | "session";
  chapters?: Chapter[];
  collection?: string; // the collection a video belongs to
}

// ---------- tracks ----------

const FIXED: Track[] = RAAG_TRACKS.flatMap((t, i): Track[] => {
  const src = t.file ?? ytId(t.youtube ?? "");
  return src
    ? [
        {
          key: "c" + i,
          title: t.title || "Untitled",
          kind: t.file ? "file" : "yt",
          src,
          time: t.time,
          origin: "fixed",
          chapters: t.chapters,
        },
      ]
    : [];
});

// Cached on the state arrays it is built from, so components can select from it
// without the store seeing a new object on every read.
let memo: {
  saved: State["saved"];
  files: State["files"];
  list: Track[];
} | null = null;

const COLLECTION_TRACKS: Track[] = SONGS_COLLECTIONS.flatMap((c, ci) =>
  c.videos.flatMap((v, vi): Track[] => {
    const src = v.file || ytId(v.youtube ?? "");
    return src
      ? [
          {
            key: `col${ci}-${vi}`,
            title: v.title,
            kind: v.file ? "file" : "yt",
            src,
            origin: "fixed",
            chapters: v.chapters,
            collection: c.title,
          },
        ]
      : [];
  }),
);

/** The name for links and files added in Calm songs. */
export const YOUR_SONGS = "Your songs";

export function allTracks(s: State = getState()): Track[] {
  if (memo && memo.saved === s.saved && memo.files === s.files)
    return memo.list;
  const list: Track[] = [
    ...FIXED,
    ...COLLECTION_TRACKS,
    ...s.saved.map(
      (t: SavedTrack): Track => ({
        key: "y" + t.id,
        title: t.title,
        kind: "yt",
        src: t.yt,
        time: t.time,
        origin: "saved",
        collection: t.group === "songs" ? YOUR_SONGS : undefined,
      }),
    ),
    ...s.files.map(
      (f): Track => ({
        key: f.key,
        title: f.title,
        kind: "file",
        src: f.src,
        origin: "session",
        collection: f.group === "songs" ? YOUR_SONGS : undefined,
      }),
    ),
  ];
  memo = { saved: s.saved, files: s.files, list };
  return list;
}

export function trackLabel(t: Track): string {
  const base =
    t.kind === "yt"
      ? "YouTube"
      : t.origin === "session"
        ? "This visit"
        : "Your audio";
  return [base, t.time ? TIME_LABEL[t.time] : ""].filter(Boolean).join(" · ");
}

// ---------- module state ----------

let cur: Track | null = null; // the track the music engine is on
let musicOn = false; // the session is sounding the music source right now
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
let gen = 0; // invalidates pending "suspend the audio clock" timers
let phaseShown = new Set<Phase>();
let recent: string[] = [];

// ---------- helpers ----------

const isRemote = (src: string) =>
  /^https?:\/\//i.test(src) && !src.startsWith(location.origin);
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
    if (
      g !== gen ||
      musicOn ||
      ambient.playing ||
      getState().timer === "running"
    )
      return;
    suspendCtx();
  }, ms);
}

// ---------- wake lock, zen, visibility ----------

let wakeLock: WakeLockSentinel | null = null;

async function keepAwake(on: boolean) {
  try {
    if (on && "wakeLock" in navigator) {
      if (!wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
        });
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
    if (s.timer === "running" && !s.sheet) setState({ zen: true });
  }, 4000);
}

/** Any pointer or key activity brings the controls back. */
export function wake() {
  reveal();
  touchControls();
  if (getState().zen) setState({ zen: false });
  if (getState().timer === "running" && !getState().sheet) scheduleZen();
}

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    getState().timer === "running"
  ) {
    keepAwake(true);
    tick();
  }
});

// ---------- the sound ----------

// a chapter to start from, set when a chapter is chosen while the session is idle
let pendingSeek: number | null = null;

/** Start a YouTube track at a given second, through the player. */
function seekYouTube(t: Track, start: number) {
  cur = t;
  setState({ ytOn: true, musicKey: t.key });
  ytEnsure()
    .catch(() => toast("YouTube couldn’t load. Check your connection."))
    .then(() => {
      if (cur !== t) return;
      ytLoadAt(t.src, start);
      ytFade(Math.round(getState().musicVol * 100), 2500);
    });
}

/** Start an audio file at a given second. */
function seekFile(t: Track, start: number) {
  cur = t;
  setState({ ytOn: false, musicKey: t.key });
  fileStart(t.src, isRemote(t.src))
    .then(() => {
      if (cur !== t) return;
      fileSeek(start);
      fileFade(getState().musicVol, 2);
    })
    .catch(() => toast("Couldn’t play that file"));
}

/** Jump to a song inside a long video. */
export function playChapter(t: Track, index: number) {
  const ch = t.chapters?.[index];
  if (!ch) return;
  if (getState().source !== "songs") setSource("songs");
  if (!getState().soundOn) setSoundOn(true);
  setState({ musicChapter: index });
  if (getState().timer === "running" && musicOn) {
    if (t.kind === "file") seekFile(t, ch.start);
    else seekYouTube(t, ch.start);
  } else {
    cur = t;
    pendingSeek = ch.start;
    save(persistKeys.lastTrack, t.key);
    start();
  }
}

function musicResume() {
  const all = tracksFor(getState().source);
  if (cur && pendingSeek !== null) {
    const start = pendingSeek;
    pendingSeek = null;
    if (cur.kind === "file") seekFile(cur, start);
    else seekYouTube(cur, start);
    return;
  }
  if (cur && all.some((t) => t.key === cur!.key)) {
    if (cur.kind === "file") {
      filePlay().then(() => fileFade(getState().musicVol, 2));
    } else {
      setState({ ytOn: true });
      ytEnsure()
        .catch(() => undefined)
        .then(() => {
          ytPlay();
          ytFade(Math.round(getState().musicVol * 100), 2500);
        });
    }
    return;
  }
  const last = load<string | null>(persistKeys.lastTrack, null);
  playTrack(all.find((t) => t.key === last) ?? firstTrack());
}

/** The tracks a sound type plays: Raag is the playlist, Calm songs are the collection videos. */
export function tracksFor(source: Source, s: State = getState()): Track[] {
  const all = allTracks(s);
  return source === "songs"
    ? all.filter((t) => t.collection)
    : all.filter((t) => !t.collection);
}

function firstTrack(): Track | null {
  const all = tracksFor(getState().source),
    p = praharNow();
  return all.find((t) => t.time === p) ?? all[0] ?? null;
}

function pickNext(dir = 1): Track | null {
  const all = tracksFor(getState().source);
  if (!all.length) return null;
  const i = cur ? all.findIndex((t) => t.key === cur!.key) : -1;
  const mode = getState().musicMode;
  if (mode === "one" && cur && dir === 1 && i >= 0) return all[i];
  if (mode === "shuffle" && all.length > 1) {
    let j: number;
    do {
      j = (Math.random() * all.length) | 0;
    } while (j === i);
    return all[j];
  }
  return all[
    ((i < 0 ? (dir > 0 ? -1 : 0) : i) + dir + all.length) % all.length
  ];
}

async function stopCurrent(sec = 0.6) {
  if (!cur) return;
  if (cur.kind === "file") {
    fileFade(0, sec);
    await wait(sec * 1000 + 60);
    filePause();
  } else {
    await ytFade(0, sec * 1000);
    ytPause();
  }
}

async function startTrack(t: Track) {
  cur = t;
  fadingOut = false;
  setState({ musicKey: t.key, musicChapter: null });
  save(persistKeys.lastTrack, t.key);
  if (t.kind === "file") {
    setState({ ytOn: false });
    try {
      await fileStart(t.src, isRemote(t.src));
    } catch {
      toast("Couldn’t play that file");
      return;
    }
    fileFade(getState().musicVol, 3);
  } else {
    setState({ ytOn: true });
    try {
      await ytEnsure();
    } catch {
      toast("YouTube couldn’t load. Check your connection.");
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
  if (cur && cur.key !== t.key) await stopCurrent(0.6);
  if (tok !== switchTok) return;
  await startTrack(t);
}

function skipSoon() {
  setTimeout(() => {
    if (musicOn) playTrack(pickNext(1));
  }, 1500);
}

async function musicPause(sec = 0.9) {
  if (!cur) return;
  const tok = ++switchTok;
  if (cur.kind === "file") {
    fileFade(0, sec);
    await wait(sec * 1000 + 60);
    if (tok === switchTok && !musicOn) filePause();
  } else {
    await ytFade(0, sec * 1000);
    if (tok === switchTok && !musicOn) ytPause();
  }
}

hooks.time = () => {
  if (!musicOn || fadingOut || !cur || cur.kind !== "file") return;
  const { current, duration } = fileProgress();
  if (!isFinite(duration) || duration < 12) return;
  const left = duration - current;
  if (left < 4.5) {
    fadingOut = true;
    fileFade(0, Math.max(0.5, left - 0.2));
  }
};
hooks.ended = () => {
  if (!musicOn) return;
  if (getState().musicMode === "one" && cur) {
    const t = cur;
    cur = null;
    playTrack(t);
  } else {
    playTrack(pickNext(1));
  }
};
hooks.error = () => {
  if (!musicOn || !cur) return;
  toast(
    cur.kind === "file"
      ? "Couldn’t play that file"
      : "That YouTube video can’t be played here",
  );
  skipSoon();
};

/** Start the chosen sound (the session has started, or the source was switched while running). */
function soundStart() {
  const s = getState();
  if (!s.soundOn) return;
  gen++;
  if (s.source === "ambient") {
    ambient.play(s.ambientVol, s.mood);
  } else {
    musicOn = true;
    if (s.source === "raag" && !allTracks().length && !s.drone) setDrone(true, true);
    musicResume();
  }
  // the tanpura is part of Raag only
  if (getState().drone && getState().source === "raag") droneStart(getState().droneVol);
}

/** Stop everything that sounds, fading out over `fade` seconds. */
function soundStop(fade = 0.8) {
  musicOn = false;
  ambient.stop(fade);
  if (cur) musicPause(fade);
  droneStop(fade + 0.5);
  idleSoon(fade * 1000 + 400);
}

export function setSoundOn(on: boolean) {
  persist("soundOn", on);
  setState({ soundOn: on });
  if (getState().timer === "running") {
    if (on) soundStart();
    else soundStop();
  } else if (!on) {
    endPreview();
  }
}

let switchTok2 = 0;

/**
 * Switch the sound type slowly: the old sound fades out, then the new one fades in.
 * Nothing stops abruptly.
 */
export function setSource(source: Source) {
  if (source === getState().source) return;
  const running = getState().timer === "running";
  persist("source", source);
  if (running) soundStop(SWITCH_FADE);
  // a new sound type starts fresh: nothing from the old one carries over
  cur = null;
  pendingSeek = null;
  setState({ source, musicKey: null, musicChapter: null, ytOn: false });
  // choosing a mode starts it, unless the sound is muted
  if (!running) {
    if (getState().soundOn) start();
    return;
  }
  const tok = ++switchTok2;
  setTimeout(() => {
    if (tok === switchTok2 && getState().timer === "running") soundStart();
  }, SWITCH_FADE * 1000 + 200);
}

export function setMood(id: string, withPreview: boolean) {
  ambient.setMood(id);
  persist("mood", id);
  setState({ mood: id });
  if (withPreview) preview();
}

/** A short taste of a mood while the timer is idle. */
function preview() {
  const s = getState();
  if (s.timer === "running" || !s.soundOn || s.source !== "ambient") return;
  ambient.play(s.ambientVol, s.mood);
  clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    previewTimer = 0;
    if (getState().timer !== "running") ambient.stop(2.5);
  }, 12000);
}

function endPreview() {
  if (!previewTimer) return;
  clearTimeout(previewTimer);
  previewTimer = 0;
  if (getState().timer !== "running") ambient.stop(1.5);
}

/** The card's volume slider: changes the volume of whichever source is active. */
export function setVolume(v: number) {
  if (getState().source === "ambient") {
    persist("ambientVol", v);
    setState({ ambientVol: v });
    ambient.setVolume(v);
  } else {
    setMusicVolume(v);
  }
}

export function setMusicVolume(v: number) {
  persist("musicVol", v);
  setState({ musicVol: v });
  if (musicOn && cur) {
    if (cur.kind === "file") {
      if (!fadingOut) fileFade(v, 0.15);
    } else ytFade(Math.round(v * 100), 150);
  }
}

export function setDroneVolume(v: number) {
  persist("droneVol", v);
  setState({ droneVol: v });
  droneSetVolume(v);
}

export function setDrone(on: boolean, quiet = false) {
  persist("drone", on);
  setState({ drone: on });
  if (getState().timer === "running" && getState().soundOn) {
    if (on && getState().source === "raag") droneStart(getState().droneVol);
    else droneStop();
  }
  if (!quiet)
    toast(on ? `Tanpura on · Sa ${KEYS[getState().droneKey]}` : "Tanpura off");
}

export function toggleDrone() {
  if (getState().source !== "raag") return toast("The tanpura plays in Raag");
  setDrone(!getState().drone);
}

export function setDroneKeyIndex(k: number) {
  persist("droneKey", k);
  setDroneKey(k);
  setState({ droneKey: k });
  if (
    getState().drone &&
    getState().timer === "running" &&
    getState().soundOn
  ) {
    droneStop(1.2);
    setTimeout(() => {
      if (
        getState().timer === "running" &&
        getState().drone &&
        getState().soundOn
      )
        droneStart(getState().droneVol);
    }, 1300);
  }
}

export function setMusicMode(mode: MusicMode) {
  persist("musicMode", mode);
  setState({ musicMode: mode });
}

/** Previous or next: the next mood in ambient, the next track in music. */
export function step(dir: 1 | -1) {
  const s = getState();
  if (s.source === "ambient") {
    const i = MOODS.findIndex((m) => m.id === s.mood);
    const next = MOODS[(i + dir + MOODS.length) % MOODS.length];
    setMood(next.id, true);
    return;
  }
  if (s.source === "songs") {
    // next or previous song inside the current video
    const video = cur?.chapters ? cur : tracksFor("songs")[0];
    if (!video?.chapters?.length) return toast("Pick a song first");
    const n = video.chapters.length;
    const i = ((s.musicChapter ?? -1) + dir + n) % n;
    playChapter(video, i);
    return;
  }
  const t = pickNext(dir);
  if (!t) return toast("Add some music first");
  playOrStart(t);
}

/** Tap a track: play it now, starting the session if it is idle. */
export function selectTrack(key: string) {
  const t = allTracks().find((x) => x.key === key);
  if (!t) return;
  if (getState().source !== "raag") setSource("raag");
  if (!getState().soundOn) setSoundOn(true);
  playOrStart(t);
}

function playOrStart(t: Track) {
  if (getState().timer === "running") {
    playTrack(t);
  } else {
    cur = null;
    save(persistKeys.lastTrack, t.key);
    start();
  }
}

/** Close the YouTube card: it pauses, and the session's sound carries on from the other sources. */
export function closeYouTube() {
  ytPause();
  setState({ ytOn: false });
}

export function removeTrack(key: string) {
  const s = getState();
  if (key[0] === "y") {
    const saved = s.saved.filter((t) => "y" + t.id !== key);
    persist("saved", saved);
    setState({ saved });
  } else {
    const f = s.files.find((x) => x.key === key);
    if (f) URL.revokeObjectURL(f.src);
    setState({ files: s.files.filter((x) => x.key !== key) });
  }
  if (cur && cur.key === key) {
    const was = musicOn;
    stopCurrent(0.5);
    cur = null;
    setState({ ytOn: false, musicKey: null });
    if (was) playTrack(pickNext(1));
  }
}

/** Returns false when the link is not a YouTube link, so the form keeps what was typed. */
export function addYouTube(
  url: string,
  title: string,
  time: Prahar | undefined,
  group: "raag" | "songs" = "raag",
): boolean {
  const id = ytId(url);
  if (!id) {
    toast("That doesn’t look like a YouTube link");
    return false;
  }
  const saved = [
    ...getState().saved,
    {
      id: Date.now().toString(36),
      yt: id,
      title: title.trim() || "YouTube track",
      time,
      group,
    },
  ];
  persist("saved", saved);
  setState({ saved });
  toast("Added to your playlist");
  return true;
}

export function addFiles(list: FileList, group: "raag" | "songs" = "raag") {
  const files = [...list].map((file) => ({
    key: "s" + Math.random().toString(36).slice(2, 8),
    title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    src: URL.createObjectURL(file),
    group,
  }));
  setState({ files: [...getState().files, ...files] });
  if (files.length)
    toast(
      `${files.length} file${files.length > 1 ? "s" : ""} added for this visit`,
    );
}

// ---------- the focus timer ----------

export function start() {
  const s = getState();
  if (s.timer === "running") return;
  clearTimeout(previewTimer);
  previewTimer = 0;
  if (s.timer === "idle" || s.timer === "done") phaseShown = new Set();
  const remaining = s.timer === "done" ? durationMs() : s.remaining;
  endAt = Date.now() + remaining;
  msgIdx = Math.floor((durationMs() - remaining) / 120000);
  setState({
    timer: "running",
    remaining,
    zen: false,
    status: MESSAGES[msgIdx % MESSAGES.length],
  });
  clearInterval(tickIv);
  if (s.minutes) tickIv = window.setInterval(tick, 250);
  soundStart();
  keepAwake(true);
  scheduleZen();
  if (s.timer !== "paused") nextLine(true);
}

export function pause() {
  const s = getState();
  if (s.timer !== "running") return;
  clearInterval(tickIv);
  const remaining = s.minutes ? Math.max(0, endAt - Date.now()) : 0;
  setState({ timer: "paused", remaining, status: "Paused" });
  soundStop();
  keepAwake(false);
  wake();
}

export function toggleSession() {
  if (getState().timer === "running") pause();
  else start();
}

export function reset() {
  clearInterval(tickIv);
  soundStop();
  phaseShown = new Set();
  setState({
    timer: "idle",
    remaining: durationMs(),
    status: "Ready when you are",
    zen: false,
  });
  keepAwake(false);
  wake();
  if (getState().view === "motivation") nextLine(true);
}

export function setMinutes(min: number) {
  const m = Math.min(180, Math.max(0, Math.round(min)));
  persist("minutes", m);
  setState({ minutes: m });
  reset();
}

function tick() {
  const s = getState();
  if (s.timer !== "running") return;
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
  if (source === "ambient") ambient.chime();
  else bell();
  try {
    navigator.vibrate?.([180, 120, 180]);
  } catch {
    /* not supported */
  }
  const n = logSession(min);
  setState({
    timer: "done",
    remaining: 0,
    status:
      n > 1
        ? `Session ${n} today · take a breath`
        : "Time’s up · take a breath",
    zen: false,
  });
  keepAwake(false);
  refreshStats();
  nextLine(true);
}

export function currentPhase(s: State): Phase | null {
  if (s.timer === "done") return "done";
  if (s.timer !== "running" || !s.minutes) return null;
  const dur = durationMs(),
    el = dur - s.remaining,
    f = el / dur;
  if (f < 0.1) return "start";
  if (s.remaining <= Math.min(180000, dur * 0.2)) return "end";
  if (f > 0.45 && f < 0.62) return "mid";
  return null;
}

// ---------- the sheet ----------

/** The Songs panel: the long videos and their songs. */
export function setSongsPanel(open: boolean) {
  setState({ songsOpen: open });
  if (open) clearTimeout(hideTimer);
  else if (getState().clean) reveal();
}

export function setSheet(open: boolean) {
  if (open) {
    refreshStats();
    clearTimeout(zenTimer);
    clearTimeout(hideTimer);
    setState({
      sheet: true,
      zen: false,
      revealed: getState().clean ? true : getState().revealed,
    });
  } else {
    endPreview();
    setState({ sheet: false });
    if (getState().timer === "running") scheduleZen();
  }
}

export function cyclePalette() {
  const i = ALL_PALETTE_IDS.indexOf(getState().palette);
  setPalette(ALL_PALETTE_IDS[(i + 1) % ALL_PALETTE_IDS.length]);
}

export function setPalette(id: string) {
  persist("palette", id);
  setState({ palette: id });
}

export function setMandala(id: MandalaId | "none") {
  persist("mandala", id);
  setState({ mandala: id });
}

export function setSongVisual(id: CalmVisualId) {
  persist("songVisual", id);
  setState({ songVisual: id });
}

export function setShapeStyle(id: ShapeStyle) {
  persist("shapeStyle", id);
  setState({ shapeStyle: id });
}

let idleTimer = 0;

/** Activity brings the Focus controls back, and they fade again after about 5 seconds still. */
function touchControls() {
  if (getState().controlsIdle) setState({ controlsIdle: false });
  clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => setState({ controlsIdle: true }), 5000);
}


export function setRaagMode(mode: State["raagMode"]) {
  persist("raagMode", mode);
  setState({ raagMode: mode });
  toast(
    mode === "auto"
      ? "Following the raga clock"
      : mode === "light"
        ? "Day light"
        : "Night light",
  );
}

export function setPrahar() {
  const p = praharNow();
  if (p !== getState().prahar) setState({ prahar: p });
}

export function setIntent(v: string) {
  const intent = v.slice(0, 60);
  persist("intent", intent);
  setState({ intent });
}

export function setWords(patch: Partial<Words>) {
  const words = { ...getState().words, ...patch };
  persist("words", words);
  setState({ words });
  recent = [];
}

/** Tap a language to add or remove it. English is always there if nothing else is chosen. */
export function toggleLang(l: Lang) {
  const cur = getState().words.langs;
  const next = cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l];
  setWords({ langs: next.length ? next : ["en"] });
}

export function setPicker(picker: Picker) {
  setState({ picker });
}

// ---------- clean screen ----------

let hideTimer = 0;

/** Hide the controls, leaving the background, the mandala and the words. */
export function setClean(on: boolean) {
  persist("clean", on);
  clearTimeout(hideTimer);
  setState({ clean: on, revealed: false });
  if (getState().sheet) setState({ revealed: true });
}

export function setCleanClock(on: boolean) {
  persist("cleanClock", on);
  setState({ cleanClock: on });
}

/** Any activity brings the controls back for a few seconds. */
function reveal() {
  const s = getState();
  if (!s.clean) return;
  if (!s.revealed) setState({ revealed: true });
  clearTimeout(hideTimer);
  // hide again after 6 seconds without activity
  if (!s.sheet && !s.songsOpen)
    hideTimer = window.setTimeout(() => setState({ revealed: false }), 6000);
}

/** Focus, Motivation or Off. Calm songs has no motivation texts, so it shows the timer instead. */
export function setView(view: View) {
  persist("view", view);
  setState({ view });
  if (view === "motivation") nextLine(true);
  else {
    clearTimeout(wordsTimer);
    setState({ lineShown: false });
  }
}

// ---------- words ----------

function fillName(s: string) {
  return s.replace(/\{n\}/g, getState().words.name.trim());
}

/** Pick from pools of [weight, items, kind]. A line already shown recently is avoided. */
function choose(
  pools: [number, readonly unknown[], "calm" | "personal" | "poem" | "mine"][],
) {
  const total = pools.reduce((a, p) => a + p[0], 0);
  let r = Math.random() * total;
  let pool = pools[0];
  for (const p of pools) {
    if ((r -= p[0]) <= 0) {
      pool = p;
      break;
    }
  }
  let item: unknown,
    key = "";
  for (let i = 0; i < 12; i++) {
    item = pick(pool[1]);
    key = typeof item === "string" ? item : (item as { text: string }).text;
    if (!recent.includes(key) || pool[1].length <= 1) break;
  }
  recent.push(key);
  if (recent.length > 30) recent.shift();
  return { pool, item };
}

function pickLine(): Line | null {
  const s = getState(),
    w = s.words,
    name = w.name.trim();
  const mine = w.mine
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const english = w.langs.includes("en");
  const others = w.langs.filter((l): l is Exclude<Lang, "en"> => l !== "en");

  // Poems and sayings: English shows all of them (each has an English meaning),
  // otherwise only the chosen languages.
  const poems = w.poems
    ? POEMS.filter((p) => english || (others as Lang[]).includes(poemLang(p)))
    : [];

  const pools: [
    number,
    readonly unknown[],
    "calm" | "personal" | "poem" | "mine",
  ][] = [];
  const ph = currentPhase(s);
  if (english && w.calm) {
    // the phase lines (start, middle, end, done) are English only
    if (ph && !phaseShown.has(ph)) {
      phaseShown.add(ph);
      const src = name && Math.random() < 0.6 ? PERSONAL[ph] : CALM[ph];
      return { text: fillName(pick(src)) };
    }
    pools.push([name ? 2 : 3, CALM.any, "calm"]);
    if (name) pools.push([1.6, PERSONAL.any, "personal"]);
  }
  if (poems.length) pools.push([english ? 3 : 3, poems, "poem"]);
  if (mine.length) pools.push([pools.length ? 1.2 : 3, mine, "mine"]);
  // a language with no poems or sayings of its own shows nothing, rather than English
  if (!english && !pools.length) return null;
  if (!pools.length) pools.push([1, CALM.any, "calm"]);

  const { pool, item } = choose(pools);
  if (pool[2] === "poem") {
    const p = item as { text: string; mean: string; by: string };
    return { text: p.text, mean: p.mean, by: p.by, poem: true };
  }
  return { text: fillName(String(item)) };
}

/** Show the next line, after the current one has faded. */
export function nextLine(soon = false) {
  clearTimeout(wordsTimer);
  if (getState().view !== "motivation") return;
  const wasShown = getState().lineShown;
  setState({ lineShown: false });
  const delay = wasShown ? 2700 : soon ? 400 : 50;
  wordsTimer = window.setTimeout(() => {
    const s = getState();
    if (s.view !== "motivation" || s.source === "songs") return;
    const line = pickLine();
    if (line) setState({ line, lineShown: true });
    wordsTimer = window.setTimeout(() => nextLine(false), s.words.speed * 1000);
  }, delay);
}

// ---------- stats ----------

type Log = Record<string, { min: number; n: number }>;

function logSession(min: number): number {
  const log = load<Log>("drift:log", {}),
    k = dayKey();
  log[k] = log[k] ?? { min: 0, n: 0 };
  log[k].min += min;
  log[k].n += 1;
  const keys = Object.keys(log).sort();
  while (keys.length > 120) delete log[keys.shift()!];
  save("drift:log", log);
  return log[k].n;
}

export function refreshStats() {
  const log = load<Log>("drift:log", {}),
    todayLog = log[dayKey()] ?? { min: 0, n: 0 };
  let week = 0,
    streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    week += log[dayKey(d)]?.min ?? 0;
  }
  for (let i = todayLog.n ? 0 : 1; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (log[dayKey(d)]?.n) streak++;
    else break;
  }
  const stats: Stats = { today: todayLog, week, streak };
  setState({ stats });
}

/** Minutes as the stats card shows them: 45m, 2h 5m. */
export const hm = (m: number) =>
  m >= 60
    ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + "m" : ""}`.trim()
    : `${m}m`;

// ---------- start-up ----------

export function boot() {
  setDroneKey(getState().droneKey);
  setState({ prahar: praharNow() });
  refreshStats();
  if (getState().view === "motivation") nextLine(true);
}
