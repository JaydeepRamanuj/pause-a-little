import { useSyncExternalStore } from 'react';
import type { Prahar, RaagClockMode } from '../data/palettes';
import { ALL_PALETTE_IDS, praharNow } from '../data/palettes';
import type { MandalaId } from '../components/mandalas';
import type { Lang } from '../data/words';
import { LANGS } from '../data/words';
import { MANDALA_IDS } from '../components/mandalas';
import { CALM_VISUALS, type CalmVisualId } from '../components/calmArt';
import { load, save } from './storage';

export type Source = 'ambient' | 'raag' | 'songs';
export type ShapeStyle = 'orbs' | 'arcs' | 'waves' | 'prisms';
const SHAPE_STYLES: ShapeStyle[] = ['orbs', 'arcs', 'waves', 'prisms'];
export type MusicMode = 'order' | 'shuffle' | 'one';
export type TimerState = 'idle' | 'running' | 'paused' | 'done';

export interface SavedTrack {
  id: string;
  yt: string;
  title: string;
  time?: Prahar;
  group?: 'raag' | 'songs'; // which sound type it was added in
}

export interface SessionFile {
  key: string;
  title: string;
  src: string;
  group?: 'raag' | 'songs';
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

// Focus shows the timer, Motivation shows the texts, Off shows neither.
export type View = 'focus' | 'motivation' | 'off';
export type Picker = 'colors' | 'mandala' | null;

export interface Words {
  langs: Lang[];
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
  mandala: MandalaId | 'none';
  picker: Picker; // the colours or mandala card, from the top bar
  view: View;
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
  musicChapter: number | null; // the chapter being played, if the track has chapters
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
  clean: boolean;      // clean screen: controls hidden until activity
  cleanClock: boolean; // show the small clock in clean screen
  revealed: boolean;   // controls are showing again after activity
  sheet: boolean;
  songsOpen: boolean; // the Songs panel
  shapeStyle: ShapeStyle; // the abstract art for Ambient
  songVisual: CalmVisualId; // the visual for Calm songs
  controlsIdle: boolean; // in Focus, the controls have faded after inactivity
  toast: { msg: string; id: number } | null;
  status: string;
  stats: Stats;
}

// Stored values keep the keys the two original rooms used, so saved stats, playlists
// and preferences carry over.
const savedPalette = load<string | number>('drift:palette', 'dawn');
const savedWords = load<Partial<Words> & { lang?: Lang; mode?: 'timer' | 'corner' }>('drift:words', {});
// older saves kept one language; now there can be several
const savedLangs = (savedWords.langs ?? (savedWords.lang ? [savedWords.lang] : []))
  .filter((l): l is Lang => LANGS.some(x => x.id === l));
const minutes = load('drift:minutes', 20);
// the sound types: Ambient, Raag (the playlist) and Calm songs. Older saves called Raag 'music'.
const savedSourceRaw = load<string>('drift:source', 'ambient');
const savedSource: Source = savedSourceRaw === 'music'
  ? 'raag'
  : (['ambient', 'raag', 'songs'] as string[]).includes(savedSourceRaw) ? (savedSourceRaw as Source) : 'ambient';

const palette = typeof savedPalette === 'number'
  ? ALL_PALETTE_IDS[savedPalette % 12] // the palette used to be stored as a list index
  : ALL_PALETTE_IDS.includes(savedPalette) ? savedPalette : 'dawn';

export const initialState: State = {
  palette,
  raagMode: load<RaagClockMode>('raag:theme', 'auto'),
  mandala: load<MandalaId | 'none'>('raag:mandala', 'lotus') === 'none' || MANDALA_IDS.includes(load('raag:mandala', 'lotus') as MandalaId)
    ? load<MandalaId | 'none'>('raag:mandala', 'lotus')
    : 'lotus',
  picker: null,
  view: load<View>('drift:view', savedWords.mode === 'corner' ? 'motivation' : 'focus'),
  prahar: praharNow(),
  soundOn: load('drift:sound', true),
  source: savedSource,
  mood: load('drift:mood', 'drift'),
  ambientVol: load('drift:volume', 0.6),
  musicVol: load('raag:vol', 0.85),
  droneVol: load('raag:dvol', 0.45),
  drone: load('raag:drone', false),
  droneKey: load('raag:key', 1),
  musicMode: load<MusicMode>('raag:mode', 'order'),
  musicKey: null,
  musicChapter: null,
  ytOn: false,
  saved: load<SavedTrack[]>('raag:yt', []),
  files: [],
  minutes,
  timer: 'idle',
  remaining: minutes * 60000,
  intent: load('drift:intent', ''),
  words: {
    langs: savedLangs.length ? savedLangs : ['en'],
    calm: savedWords.calm ?? true,
    poems: savedWords.poems ?? true,
    name: savedWords.name ?? '',
    mine: savedWords.mine ?? '',
    speed: savedWords.speed ?? 30,
  },
  line: null,
  lineShown: false,
  zen: false,
  clean: load('drift:clean', true), // clean screen is the default
  cleanClock: load('drift:cleanClock', true),
  revealed: false,
  sheet: false,
  songsOpen: false,
  shapeStyle: SHAPE_STYLES.includes(load('drift:shapeStyle', 'orbs') as ShapeStyle) ? load<ShapeStyle>('drift:shapeStyle', 'orbs') : 'orbs',
  controlsIdle: false,
  songVisual: CALM_VISUALS.some(v => v.id === load('drift:songVisual', 'ripples')) ? load<CalmVisualId>('drift:songVisual', 'ripples') : 'ripples',
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
  mandala: 'raag:mandala',
  view: 'drift:view',
  clean: 'drift:clean',
  cleanClock: 'drift:cleanClock',
  soundOn: 'drift:sound',
  source: 'drift:source',
  mood: 'drift:mood',
  shapeStyle: 'drift:shapeStyle',
  songVisual: 'drift:songVisual',
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
