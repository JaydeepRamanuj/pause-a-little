// Colour palettes. Values are copied from the two original rooms so every look is unchanged.
// `raag` palettes come from the raag room: they get the mandala, the diya glow, the tanpura
// strings and (when dark) the stars. Focus palettes are plain.

export interface Palette {
  id: string;
  name: string;
  bg: string;
  /** "r,g,b" for text colour */
  ink: string;
  dark: boolean;
  colors: string[];
  accent?: string;
  raag?: boolean;
}

const LIGHT_INK = '59,47,63';
const DARK_INK = '236,230,247';

export const FOCUS_PALETTES: Palette[] = [
  { id: 'dawn', name: 'Dawn', bg: '#f6e7e1', ink: LIGHT_INK, dark: false, colors: ['#f9c6c9', '#f7d9b5', '#d8c8f0', '#bfe0e4', '#fbe3ef'] },
  { id: 'lagoon', name: 'Lagoon', bg: '#dcebee', ink: '32,52,60', dark: false, colors: ['#a8d8dc', '#c4e3d4', '#b7c9ef', '#eef4f2', '#9fc7d9'] },
  { id: 'meadow', name: 'Meadow', bg: '#ebefe1', ink: '44,58,42', dark: false, colors: ['#cfe3b8', '#f3e6bb', '#b9dcc7', '#ecd8c6', '#d6e8d9'] },
  { id: 'lilac', name: 'Lilac', bg: '#ece6f3', ink: LIGHT_INK, dark: false, colors: ['#d9c9f2', '#f5cfe0', '#c5d6f5', '#f0e2f7', '#e2d4ea'] },
  { id: 'dusk', name: 'Dusk', bg: '#1c1a2c', ink: DARK_INK, dark: true, colors: ['#4b3f72', '#7a5c8e', '#2f4a6d', '#a77898', '#356070'] },
  { id: 'midnight', name: 'Midnight', bg: '#0e1525', ink: DARK_INK, dark: true, colors: ['#1f3a68', '#2c5282', '#3b4a7a', '#5a6fa8', '#1e4e5f'] },
  { id: 'aurora', name: 'Aurora', bg: '#0a1a1c', ink: DARK_INK, dark: true, colors: ['#1d6b5e', '#2f8f7a', '#3a4f8c', '#6b4f9a', '#1f5f6f'] },
  { id: 'ember', name: 'Ember', bg: '#1d1311', ink: '247,234,224', dark: true, colors: ['#7a3b2e', '#a0573c', '#6e2f45', '#b07a4f', '#4a2a3a'] },
  { id: 'plum', name: 'Plum', bg: '#1c111f', ink: DARK_INK, dark: true, colors: ['#5e2b5c', '#8a3f74', '#3f2a66', '#a35c8a', '#4b3060'] },
  { id: 'deep-sea', name: 'Deep Sea', bg: '#06181e', ink: '226,240,244', dark: true, colors: ['#0e4a5c', '#136f7a', '#1d3f6b', '#2a8a8a', '#0f2f4a'] },
  { id: 'forest', name: 'Forest', bg: '#0e1912', ink: '230,240,228', dark: true, colors: ['#24513a', '#3d6b45', '#5b7a3f', '#2f5f5a', '#1f3d2c'] },
  { id: 'cosmos', name: 'Cosmos', bg: '#0b0a16', ink: DARK_INK, dark: true, colors: ['#2b2463', '#4c2f7a', '#7a3f7f', '#233a6e', '#5e2b5a'] },
];

/** The raag clock: four palettes that follow the time of day (prahar). */
export const RAAG_PALETTES: Record<'prabhat' | 'din' | 'sandhya' | 'ratri', Palette> = {
  prabhat: { id: 'prabhat', name: 'Prabhat', bg: '#f6eee4', ink: '74,52,46', dark: false, accent: '#b9773f', raag: true, colors: ['#f2cdb9', '#f1dfbd', '#e8c4c9', '#f7e8d3', '#e4cdb6'] },
  din: { id: 'din', name: 'Din', bg: '#f5f0e4', ink: '66,56,38', dark: false, accent: '#a9803a', raag: true, colors: ['#ecdcb4', '#e6d0a0', '#d6dfc8', '#f2e6d2', '#e4cfb4'] },
  sandhya: { id: 'sandhya', name: 'Sandhya', bg: '#231520', ink: '247,233,220', dark: true, accent: '#e2a45c', raag: true, colors: ['#6a2d38', '#8a4a37', '#3b2a4e', '#9a5c3c', '#4a2237'] },
  ratri: { id: 'ratri', name: 'Ratri', bg: '#0c0f21', ink: '234,231,246', dark: true, accent: '#d8b26c', raag: true, colors: ['#1d2450', '#2a2e62', '#382a55', '#1b3450', '#3f3226'] },
};

export type RaagClockMode = 'auto' | 'light' | 'dark';
export type Prahar = 'dawn' | 'day' | 'dusk' | 'night';

/** Time of day in the raag sense. */
export function praharNow(date = new Date()): Prahar {
  const h = date.getHours();
  return h >= 4 && h < 10 ? 'dawn' : h >= 10 && h < 16 ? 'day' : h >= 16 && h < 20 ? 'dusk' : 'night';
}

export const PRAHAR: Record<Prahar, { hi: string; en: string; ragas: string }> = {
  dawn: { hi: 'प्रभात', en: 'Dawn', ragas: 'Bhairav · Lalit · Todi' },
  day: { hi: 'दोपहर', en: 'Day', ragas: 'Bhimpalasi · Sarang · Multani' },
  dusk: { hi: 'संध्या', en: 'Dusk', ragas: 'Yaman · Puriya Dhanashri · Marwa' },
  night: { hi: 'रात्रि', en: 'Night', ragas: 'Darbari · Bageshree · Malkauns' },
};

/** The id that stands for "follow the raag clock" in the palette list. */
export const RAAG_CLOCK_ID = 'raag';



/** Resolve a palette id (plus raag clock mode) to the actual palette to show. */
export function resolvePalette(id: string, mode: RaagClockMode, prahar: Prahar): Palette {
  const calm = SONG_PALETTES.find(p => p.id === id);
  if (calm) return calm;
  if (id === RAAG_CLOCK_ID) {
    const key = mode === 'light'
      ? (prahar === 'day' ? 'din' : 'prabhat')
      : mode === 'dark'
        ? (prahar === 'dusk' ? 'sandhya' : 'ratri')
        : ({ dawn: 'prabhat', day: 'din', dusk: 'sandhya', night: 'ratri' } as const)[prahar];
    return RAAG_PALETTES[key];
  }
  return FOCUS_PALETTES.find(p => p.id === id) ?? FOCUS_PALETTES[0];
}

// Calm songs have their own colours, separate from the focus and raag ones.
export const SONG_PALETTES: Palette[] = [
  { id: 'moonlit', name: 'Moonlit', bg: '#14163a', ink: '232,234,255', dark: true, colors: ['#2a3a7a', '#4b3c8f', '#1f5f7a', '#6a4f9c', '#2c4f6e'] },
  { id: 'golden', name: 'Golden hour', bg: '#f7e6c8', ink: '70,48,30', dark: false, colors: ['#f6c77a', '#f0a868', '#e9b5a0', '#fbe2b0', '#d98f6b'] },
  { id: 'sea-glass', name: 'Sea glass', bg: '#d9ece9', ink: '26,58,60', dark: false, colors: ['#9fd8d0', '#bfe6dc', '#8fc6d8', '#e5f5f0', '#7fb8c9'] },
  { id: 'rose-dusk', name: 'Rose dusk', bg: '#2a1a24', ink: '248,232,238', dark: true, colors: ['#7a3350', '#a24f6e', '#5c3a7a', '#c77b8f', '#8a4a6a'] },
  { id: 'monsoon', name: 'Monsoon', bg: '#1a2430', ink: '226,236,242', dark: true, colors: ['#2e4a5e', '#3c6e7a', '#4b5f8a', '#2b5c58', '#5a7c92'] },
  { id: 'linen', name: 'Linen', bg: '#f5efe6', ink: '60,52,44', dark: false, colors: ['#e8d6bd', '#d9c3a8', '#f0e4d0', '#cdb89a', '#e3cfb2'] },
];



/** Every colour, for any mode: the focus ones, the calm ones, and the raag clock. */
export const ALL_PALETTE_IDS = [...FOCUS_PALETTES, ...SONG_PALETTES].map(p => p.id).concat(RAAG_CLOCK_ID);
