// Generative ambient moods. Everything is composed live in the browser, so it never repeats.

export interface Mood {
  id: string;
  name: string;
  desc: string;
  chords?: number[][];
  drone?: number[];
  len?: number;
  attack?: number;
  release?: number;
  cutoff: number;
  lfoRate: number;
  lfoDepth: number;
  voice: 'soft' | 'warm' | 'glass';
  padGain: number;
  bells?: BellSpec[];
  arp?: { type: string; step: number; octave: number; pattern: number[]; prob: number };
  noise?: { type: 'air' | 'rain' | 'ocean'; gain: number };
}

export interface BellSpec {
  type: string;
  notes: number[];
  min: number;
  max: number;
  prob: number;
  vel: [number, number];
  pair?: number;
}

export const MOODS: Mood[] = [
  { id: 'drift', name: 'Drift', desc: 'Airy pads and soft glass bells',
    chords: [[50, 57, 61, 64, 66], [47, 54, 57, 62, 64], [43, 50, 59, 66, 69], [45, 52, 59, 61, 64]],
    len: 14, attack: 4, release: 6, cutoff: 950, lfoRate: .045, lfoDepth: 380, voice: 'soft', padGain: .5,
    bells: [{ type: 'bell', notes: [69, 71, 74, 76, 78, 81, 83, 86], min: 2.5, max: 8, prob: .8, vel: [.45, 1], pair: .3 }],
    noise: { type: 'air', gain: .045 } },
  { id: 'rain', name: 'Rainfall', desc: 'Warm chords under gentle rain',
    chords: [[41, 48, 55, 60, 63], [37, 49, 56, 60, 65], [44, 51, 56, 60, 63], [39, 46, 55, 58, 62]],
    len: 16, attack: 5, release: 7, cutoff: 720, lfoRate: .04, lfoDepth: 260, voice: 'warm', padGain: .45,
    bells: [{ type: 'bell', notes: [72, 75, 77, 80, 82, 84], min: 4, max: 10, prob: .6, vel: [.35, .8], pair: .2 }],
    noise: { type: 'rain', gain: .05 } },
  { id: 'ocean', name: 'Ocean', desc: 'Slow waves and shimmering light',
    chords: [[40, 47, 56, 59, 63, 66], [45, 52, 56, 59, 61], [42, 49, 57, 61, 64], [47, 54, 59, 63, 66]],
    len: 18, attack: 6, release: 8, cutoff: 820, lfoRate: .035, lfoDepth: 320, voice: 'soft', padGain: .42,
    bells: [{ type: 'shimmer', notes: [76, 78, 80, 83, 85, 88], min: 5, max: 11, prob: .7, vel: [.5, 1], pair: .25 }],
    noise: { type: 'ocean', gain: .07 } },
  { id: 'night', name: 'Night', desc: 'Deep, slow minor chords for late hours',
    chords: [[45, 52, 60, 64, 67], [41, 48, 57, 60, 64], [43, 50, 55, 59, 62], [40, 47, 55, 59, 64]],
    len: 20, attack: 6, release: 8, cutoff: 600, lfoRate: .03, lfoDepth: 240, voice: 'warm', padGain: .5,
    bells: [{ type: 'bell', notes: [69, 72, 74, 76, 79], min: 6, max: 14, prob: .55, vel: [.3, .65], pair: .15 }],
    noise: { type: 'air', gain: .035 } },
  { id: 'temple', name: 'Temple', desc: 'Warm drone with singing bowls',
    drone: [36, 43, 48], cutoff: 1200, lfoRate: .05, lfoDepth: 300, voice: 'soft', padGain: .5,
    bells: [
      { type: 'bowl', notes: [60, 62, 64, 67, 69], min: 6, max: 12, prob: .85, vel: [.55, 1] },
      { type: 'pluck', notes: [72, 74, 76, 79, 81], min: 3, max: 7, prob: .45, vel: [.25, .5], pair: .3 },
    ],
    noise: { type: 'air', gain: .03 } },
  { id: 'lullaby', name: 'Lullaby', desc: 'A tender music box, softly turning',
    chords: [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 57, 60], [43, 50, 55, 59]],
    len: 10, attack: 3, release: 5, cutoff: 1000, lfoRate: .05, lfoDepth: 300, voice: 'soft', padGain: .32,
    arp: { type: 'musicbox', step: .6, octave: 24, pattern: [0, 1, 2, 3, 2, 1, 2, 0], prob: .85 },
    noise: { type: 'air', gain: .02 } },
  { id: 'cosmos', name: 'Cosmos', desc: 'Vast floating space pads',
    chords: [[38, 45, 52, 57, 64], [36, 43, 50, 55, 62], [34, 41, 48, 53, 60], [36, 43, 50, 57, 64]],
    len: 22, attack: 7, release: 9, cutoff: 1400, lfoRate: .028, lfoDepth: 520, voice: 'glass', padGain: .42,
    bells: [{ type: 'shimmer', notes: [74, 76, 81, 83, 86, 88, 93], min: 3, max: 7, prob: .7, vel: [.4, .9], pair: .35 }],
    noise: { type: 'air', gain: .03 } },
];

export const moodById = (id: string): Mood => MOODS.find(m => m.id === id) ?? MOODS[0];
