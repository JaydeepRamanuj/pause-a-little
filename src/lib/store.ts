import { useSyncExternalStore } from 'react';
import type { Prahar, RaagClockMode } from '../data/palettes';
import { ALL_PALETTE_IDS, praharNow } from '../data/palettes';
import { load, save } from './storage';

export type Source = 'ambient' | 'music';
export type MusicMode = 'order' | 'shuffle' | 'one';
export type TimerState = 'idle' | 'running' | 'paused' | 'done';

export interface SavedTrack {
  id: string;
  yt: string;
  title: string;
  time?: Prahar;
}

export interface SessionFile {
  key: string;
  title: string;
  src: string;
}

export interface Line {
  text: string;
  mean?: string;
  by?: string;
  poem?: boolean;
}

export interface Stats {
  today: { min: number; n: number };
  week: number;
  streak: number;
}

export interface Words {
  mode: 'timer' | 'corner';
  calm: boolean;
  poems: boolean;
  name: string;
  mine: string;
  speed: number;
}

export interface State {
  // look
  palette: string;
  raagMode: RaagClockMode;
  prahar: Prahar;
  // sound
  soundOn: boolean;
  source: Source;
  mood: string;
  ambientVol: number;
  musicVol: number;
  droneVol: number;
  drone: boolean;
  droneKey: number;
  musicMode: MusicMode;
  musicKey: string | null; // the track in the session
  ytOn: boolean;
  saved: SavedTrack[];
  files: SessionFile[];
  // focus timer
  minutes: number; // 0 = no timer
  timer: TimerState;
  remaining: number;
  intent: string;
  // words
  words: Words;
  line: Line | null;
  lineShown: boolean;
  // chrome
  zen: boolean;
  sheet: boolean;
  toast: { msg: string; id: number } | null;
  status: string;
  stats: Stats;
}

// Stored values keep the keys the two original rooms used, so saved stats, playlists
// and preferences carry over.
const savedPalette = load<string | number>('drift:palette', 'dawn');
const savedWords = load<Partial<Words>>('drift:words', {});
const minutes = load('drift:minutes', 20);

const palette = typeof savedPalette === 'number'
  ? ALL_PALETTE_IDS[savedPalette % 12] // the palette used to be stored as a list index
  : ALL_PALETTE_IDS.includes(savedPalette) ? savedPalette : 'dawn';

export const initialState: State = {
  palette,
  raagMode: load<RaagClockMode>('raag:theme', 'auto'),
  prahar: praharNow(),
  soundOn: load('drift:sound', true),
  source: load<Source>('drift:source', 'ambient'),
  mood: load('drift:mood', 'drift'),
  ambientVol: load('drift:volume', 0.6),
  musicVol: load('raag:vol', 0.85),
  droneVol: load('raag:dvol', 0.45),
  drone: load('raag:drone', false),
  droneKey: load('raag:key', 1),
  musicMode: load<MusicMode>('raag:mode', 'order'),
  musicKey: null,
  ytOn: false,
  saved: load<SavedTrack[]>('raag:yt', []),
  files: [],
  minutes,
  timer: 'idle',
  remaining: minutes * 60000,
  intent: load('drift:intent', ''),
  words: {
    mode: savedWords.mode === 'corner' ? 'corner' : 'timer',
    calm: savedWords.calm ?? true,
    poems: savedWords.poems ?? true,
    name: savedWords.name ?? '',
    mine: savedWords.mine ?? '',
    speed: savedWords.speed ?? 30,
  },
  line: null,
  lineShown: false,
  zen: false,
  sheet: false,
  toast: null,
  status: 'Ready when you are',
  stats: { today: { min: 0, n: 0 }, week: 0, streak: 0 },
};

let state: State = initialState;
const listeners = new Set<() => void>();

export const getState = () => state;

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Subscribe a component to part of the state. */
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

/** Keeps a preference in localStorage under its original key. */
export const persistKeys = {
  palette: 'drift:palette',
  raagMode: 'raag:theme',
  soundOn: 'drift:sound',
  source: 'drift:source',
  mood: 'drift:mood',
  ambientVol: 'drift:volume',
  musicVol: 'raag:vol',
  droneVol: 'raag:dvol',
  drone: 'raag:drone',
  droneKey: 'raag:key',
  musicMode: 'raag:mode',
  lastTrack: 'raag:last',
  saved: 'raag:yt',
  minutes: 'drift:minutes',
  intent: 'drift:intent',
  words: 'drift:words',
} as const;

export function persist<K extends keyof typeof persistKeys>(key: K, value: unknown) {
  save(persistKeys[key], value);
}
