// A few facts about common raags, shown beside a raag track whose title names one.
// To add one: a lower-case key that appears in the track title, then its details.

import type { Prahar } from './palettes';

export interface RaagInfo {
  name: string;
  thaat: string;
  /** the hour it is traditionally played */
  prahar: Prahar;
  /** the hour in words */
  hour: string;
  /** the feeling it carries */
  mood: string;
}

const RAAGS: Record<string, RaagInfo> = {
  bhairavi: { name: 'Bhairavi', thaat: 'Bhairavi', prahar: 'dawn', hour: 'early morning', mood: 'tender, devotional' },
  bhairav: { name: 'Bhairav', thaat: 'Bhairav', prahar: 'dawn', hour: 'dawn', mood: 'serene, grave' },
  yaman: { name: 'Yaman', thaat: 'Kalyan', prahar: 'dusk', hour: 'early evening', mood: 'peaceful, romantic' },
  todi: { name: 'Todi', thaat: 'Todi', prahar: 'dawn', hour: 'late morning', mood: 'yearning, intense' },
  bilawal: { name: 'Bilawal', thaat: 'Bilawal', prahar: 'dawn', hour: 'morning', mood: 'bright, open' },
  bhimpalasi: { name: 'Bhimpalasi', thaat: 'Kafi', prahar: 'day', hour: 'afternoon', mood: 'longing, gentle' },
  sarang: { name: 'Sarang', thaat: 'Kafi', prahar: 'day', hour: 'midday', mood: 'bright, still' },
  puriya: { name: 'Puriya', thaat: 'Marwa', prahar: 'dusk', hour: 'sunset', mood: 'restless, twilit' },
  marwa: { name: 'Marwa', thaat: 'Marwa', prahar: 'dusk', hour: 'sunset', mood: 'unsettled, deep' },
  malkauns: { name: 'Malkauns', thaat: 'Bhairavi', prahar: 'night', hour: 'midnight', mood: 'heavy, meditative' },
  darbari: { name: 'Darbari', thaat: 'Asavari', prahar: 'night', hour: 'late night', mood: 'majestic, deep' },
  bageshree: { name: 'Bageshri', thaat: 'Kafi', prahar: 'night', hour: 'night', mood: 'tender, waiting' },
  bageshri: { name: 'Bageshri', thaat: 'Kafi', prahar: 'night', hour: 'night', mood: 'tender, waiting' },
  desh: { name: 'Desh', thaat: 'Khamaj', prahar: 'night', hour: 'evening', mood: 'rainy, romantic' },
};

/** Details for the raag named in a track title (e.g. "Raag Bhairavi · Sitar"), or null. */
export function raagInfoFor(title: string): RaagInfo | null {
  const t = title.toLowerCase();
  // the longest key first, so "bhairavi" wins over "bhairav"
  const keys = Object.keys(RAAGS).sort((a, b) => b.length - a.length);
  const hit = keys.find(k => t.includes(k));
  return hit ? RAAGS[hit] : null;
}

/** One line for a list row: "Bhairavi thaat · early morning · tender, devotional". */
export function raagLine(info: RaagInfo): string {
  return `${info.thaat} thaat · ${info.hour} · ${info.mood}`;
}
