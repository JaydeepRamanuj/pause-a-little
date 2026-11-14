// The sound side of the session: the track list, the music queue, ambient, the tanpura and
// the volumes. The timer calls soundStart() and soundStop(); everything else is called from the UI.

import { ambient } from "../audio/ambient";
import { suspendCtx } from "../audio/context";
import {
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
import { praharNow } from "../data/palettes";
import { SONGS_COLLECTIONS, RAAG_TRACKS, TIME_LABEL, type Chapter } from "../data/tracks";
import { getState, persist, persistKeys, setState } from "../lib/store";
import type { MusicMode, SavedTrack, Source, State } from "../lib/store";
import { load, save } from "../lib/storage";
import { wait, ytId } from "../lib/util";
import { start } from "./timer";
import { toast } from "./ui";

const KEYS = ["C", "C#", "D", "D#", "E", "F"];
/** How long a sound type takes to fade out (and the next to fade in), in seconds. */
const SWITCH_FADE = 3;

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
let previewTimer = 0;
let gen = 0; // invalidates pending "suspend the audio clock" timers

// ---------- helpers ----------

const isRemote = (src: string) =>
  /^https?:\/\//i.test(src) && !src.startsWith(location.origin);

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


/** What is sounding, for the session log: the ambient mood, or the music track's title. */
export function soundDetail(): { mood: string | null; track: string | null } {
  const s = getState();
  if (s.source === "ambient") return { mood: s.mood, track: null };
  return { mood: null, track: cur?.title ?? null };
}

/** The name of what is sounding, for the lock screen: the track, or the ambient mood. */
export function soundTitle(): string | null {
  const s = getState();
  if (s.source === "ambient") return MOODS.find((m) => m.id === s.mood)?.name ?? null;
  return cur?.title ?? null;
}

/** Stop the short mood preview (the timer is starting). */
export function cancelPreview() {
  clearTimeout(previewTimer);
  previewTimer = 0;
}

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
export function soundStart() {
  const s = getState();
  if (!s.soundOn) return;
  gen++;
  if (s.block !== "focus") return breakSoundStart(s);
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

/** Breaks sound lighter: the tanpura alone for Raag, a soft ambient mood otherwise. */
/** A slow, open mood for breaks (never the same one the person focuses with). */
const breakMood = (focusMood: string) => (focusMood === "ocean" ? "drift" : "ocean");
function breakSoundStart(s: State) {
  musicOn = false;
  if (cur) musicPause(0.8);
  if (s.source === "raag") {
    ambient.stop(0.8);
    droneStart(s.droneVol * 0.9);
  } else {
    droneStop(1);
    ambient.play(s.ambientVol * 0.7, breakMood(s.mood));
  }
}

/** Stop everything that sounds, fading out over `fade` seconds. */
export function soundStop(fade = 0.8) {
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

/** Choose a sound type, mood and track for a saved setup, without starting anything. */
export function applySound(source: Source, mood: string, track: string | null) {
  if (getState().timer === "running") return;
  cur = null;
  pendingSeek = null;
  persist("source", source);
  setState({ source, musicKey: null, musicChapter: null, ytOn: false });
  if (MOODS.some((m) => m.id === mood)) setMood(mood, false);
  if (track && allTracks().some((t) => t.key === track && t.origin !== "session")) save(persistKeys.lastTrack, track);
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

export function endPreview() {
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

