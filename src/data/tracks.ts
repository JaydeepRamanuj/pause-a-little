// YOUR MUSIC — add one line per track.
// • Local file: put it in the "public/songs" folder and use 'songs/name.mp3',
//   or paste a full link to an audio file (e.g. from Cloudinary).
// • YouTube: paste the full link.
// • time (optional): dawn | day | dusk | night — the raag hour it suits.

import type { Prahar } from "./palettes";

export interface Chapter {
  title: string;
  /** where the song starts, in seconds */
  start: number;
}

export interface FixedTrack {
  title: string;
  file?: string;
  youtube?: string;
  time?: Prahar;
  /** songs inside one long video, each one a jump point */
  chapters?: Chapter[];
}

// Chill Songs Vol.03: the chapter times from the video. Add its link in `youtube` to show it.
const CHILL_VOL_03: Chapter[] = [
  { title: "You're My Light", start: 0 },
  { title: "Gentle Days", start: 185 },
  { title: "Touch the sky", start: 378 },
  { title: "The Fisherman and the Mermaid", start: 562 },
  { title: "On the Road Again", start: 774 },
  { title: "Me and You", start: 1003 },
  { title: "In Your Arms", start: 1211 },
  { title: "Let It Flow", start: 1414 },
  { title: "Somewhere to Breathe", start: 1621 },
  { title: "Meant to Be", start: 1836 },
  { title: "Only You", start: 2050 },
  { title: "Where the silence sings out loud", start: 2270 },
  { title: "Stand By You", start: 2466 },
  { title: "Take Me Somewhere New", start: 2657 },
  { title: "The Way You Are", start: 2843 },
  { title: "Loop Play", start: 3066 },
];

// Chill Songs Vol.01: the chapter times from the video. Add its link in `youtube` to show it.
const CHILL_VOL_01: Chapter[] = [
  { title: "Somewhere Quiet", start: 0 },
  { title: "All for You", start: 178 },
  { title: "Breathe and Let Go", start: 395 },
  { title: "Breathe It All In", start: 598 },
  { title: "Ease the Day", start: 802 },
  { title: "Easy Breezy Day", start: 982 },
  { title: "Endless Breeze", start: 1174 },
  { title: "Endless Horizon", start: 1388 },
  { title: "Endless Sunshine", start: 1610 },
  { title: "Floating Away", start: 1781 },
  { title: "Just Breathe", start: 1976 },
  { title: "Ocean Carry", start: 2201 },
  { title: "Ocean Escape", start: 2412 },
  { title: "Something About You", start: 2611 },
  { title: "Take It Slow", start: 2800 },
  { title: "Loop Play", start: 2988 },
];

// Chill Songs Vol.02: the chapter times from the video. Add its link in `youtube` to show it.
const CHILL_VOL_02: Chapter[] = [
  { title: "Sunny Days", start: 0 },
  { title: "Lean on My Love", start: 211 },
  { title: "Always With You", start: 408 },
  { title: "If Fate Brings You Back", start: 630 },
  { title: "Underneath the Endless Sky", start: 823 },
  { title: "Because of You", start: 1018 },
  { title: "From Afar", start: 1188 },
  { title: "Brave Enough to Begin", start: 1426 },
  { title: "Forever", start: 1653 },
  { title: "Whispered Love", start: 1840 },
  { title: "Chasing the Sun", start: 2032 },
  { title: "Every Day With You", start: 2201 },
  { title: "Drift Away", start: 2411 },
  { title: "Feel the breeze", start: 2623 },
  { title: "First Time Love", start: 2819 },
  { title: "Loop Play", start: 3058 },
];

/** One video inside a collection, with its songs as chapters. */
export interface CollectionVideo {
  title: string;
  /** a Cloudinary (or other) audio link */
  file?: string;
  /** or a YouTube link */
  youtube?: string;
  chapters: Chapter[];
}

/** Several long videos grouped together, shown as one entry with a picker. */
export interface Collection {
  title: string;
  videos: CollectionVideo[];
}

export const SONGS_COLLECTIONS: Collection[] = [
  {
    title: "Chill Songs",
    videos: [
      {
        title: "Vol.01",
        file: "https://res.cloudinary.com/jd-r/video/upload/v1793648190/pause-a-little/Chill_Songs_Vol._01_English_m6nlgu.mp3",
        chapters: CHILL_VOL_01,
      }, // paste the Cloudinary link into `file`
      {
        title: "Vol.02",
        file: "https://res.cloudinary.com/jd-r/video/upload/v1793647895/pause-a-little/Chill_Songs_Vol._02_English_yi3pzh.mp3",
        chapters: CHILL_VOL_02,
      }, // paste the Cloudinary link into `file`
      {
        title: "Vol.03",
        file: "https://res.cloudinary.com/jd-r/video/upload/v1793648080/pause-a-little/Chill_Songs_Vol._03_English_aaznts.mp3",
        chapters: CHILL_VOL_03,
      }, // paste the Cloudinary link into `file`
    ],
  },
];

export const RAAG_TRACKS: FixedTrack[] = [
  {
    title: "Raag Bhairavi",
    file: "https://res.cloudinary.com/jd-r/video/upload/v1793519792/pause-a-little/raag_bhairavi_id9ywx.mp3",
    time: "dawn",
  },
  {
    title: "Raag Bhairav",
    file: "https://res.cloudinary.com/jd-r/video/upload/v1793519686/pause-a-little/raag_bhairav_kqyay0.mp3",
    time: "dawn",
  },
  {
    title: "Krishna Bansuri",
    file: "https://res.cloudinary.com/jd-r/video/upload/v1793519773/pause-a-little/krishna_bansuri_dvyxni.mp3",
    time: "dawn",
  },
  {
    title: "Sweet Krishna",
    file: "https://res.cloudinary.com/jd-r/video/upload/v1793639353/pause-a-little/Krishna_Bansuri_Collection_b8ef3q.mp3",
    time: "dusk",
  },
  // { title: 'Raag Yaman · Bansuri', file: 'songs/yaman-bansuri.mp3', time: 'dusk' },
  // { title: 'Raag Bhairav · Sitar',  file: 'songs/bhairav-sitar.mp3', time: 'dawn' },
];

export const TIME_LABEL: Record<Prahar, string> = {
  dawn: "Dawn",
  day: "Day",
  dusk: "Dusk",
  night: "Night",
};
