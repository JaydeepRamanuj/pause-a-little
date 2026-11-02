// YOUR MUSIC — add one line per track.
// • Local file: put it in the "public/songs" folder and use 'songs/name.mp3',
//   or paste a full link to an audio file (e.g. from Cloudinary).
// • YouTube: paste the full link.
// • time (optional): dawn | day | dusk | night — the raag hour it suits.

import type { Prahar } from './palettes';

export interface FixedTrack {
  title: string;
  file?: string;
  youtube?: string;
  time?: Prahar;
}

export const RAAG_TRACKS: FixedTrack[] = [
  { title: 'My first raag', youtube: 'https://youtube.com/watch?v=1VBZVVy6ocE', time: 'dusk' },
  { title: 'Raag Bhairavi', file: 'https://res.cloudinary.com/jd-r/video/upload/v1793519792/pause-a-little/raag_bhairavi_id9ywx.mp3', time: 'dawn' },
  { title: 'Raag Bhairavi', file: 'https://res.cloudinary.com/jd-r/video/upload/v1793519686/pause-a-little/raag_bhairav_kqyay0.mp3', time: 'dawn' },
  { title: 'Krishna Bansuri', file: 'https://res.cloudinary.com/jd-r/video/upload/v1793519773/pause-a-little/krishna_bansuri_dvyxni.mp3', time: 'dawn' },
  // { title: 'Raag Yaman · Bansuri', file: 'songs/yaman-bansuri.mp3', time: 'dusk' },
  // { title: 'Raag Bhairav · Sitar',  file: 'songs/bhairav-sitar.mp3', time: 'dawn' },
];

export const TIME_LABEL: Record<Prahar, string> = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' };
