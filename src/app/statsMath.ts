// The pure part of the stats: the session log, the totals and the streak.
// Nothing here touches the store or localStorage, so it is easy to test.

import type { Source, Stats } from "../lib/store";
import { dayKey } from "../lib/util";

/** One logged session. */
export interface SessionRec {
  start: number; // when it began, in ms since 1970
  min: number; // minutes actually spent (for a finished session, the full length)
  intent: string; // what the person wrote they would focus on
  mode: Source | null; // Ambient, Raag or Calm songs (null for sessions from the old log)
  mood: string | null; // the ambient mood id
  track: string | null; // the title of the music track, if there was one
  completed: boolean; // the timer ran out (false = ended early)
  legacy?: true; // came from the old per-day log
}

/** A session shorter than this (ended early) is not logged. */
export const MIN_PARTIAL = 5;
/** How many days of history are kept. */
export const KEEP_DAYS = 365;

export type OldLog = Record<string, { min: number; n: number }>;

/**
 * Turn the old per-day totals into session records, so nothing is lost: a day with
 * `n` sessions becomes `n` records at noon, sharing the minutes.
 */
export function migrateLegacy(old: OldLog): SessionRec[] {
  const out: SessionRec[] = [];
  for (const [day, v] of Object.entries(old)) {
    const n = Math.max(0, Math.round(v?.n ?? 0));
    const min = Math.max(0, Math.round(v?.min ?? 0));
    const [y, m, d] = day.split("-").map(Number);
    if (!n || !y || !m || !d) continue;
    const base = Math.floor(min / n);
    for (let i = 0; i < n; i++) {
      out.push({
        start: new Date(y, m - 1, d, 12, i).getTime(),
        min: i === 0 ? base + (min - base * n) : base,
        intent: "",
        mode: null,
        mood: null,
        track: null,
        completed: true,
        legacy: true,
      });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Drop sessions older than a year (counted back from `now`). */
export function trimHistory(recs: SessionRec[], now = new Date()): SessionRec[] {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (KEEP_DAYS - 1));
  return recs.filter((r) => r.start >= from.getTime());
}

/** Minutes and session count per day (key = YYYY-MM-DD, local time). */
export function dayTotals(recs: SessionRec[]): Record<string, { min: number; n: number }> {
  const days: Record<string, { min: number; n: number }> = {};
  for (const r of recs) {
    const k = dayKey(new Date(r.start));
    const day = (days[k] ??= { min: 0, n: 0 });
    day.min += r.min;
    day.n += 1;
  }
  return days;
}

/** Today's totals, this week's minutes (last 7 days) and the day streak. */
export function computeStats(recs: SessionRec[], now = new Date()): Stats {
  const days = dayTotals(recs);
  const back = (i: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return dayKey(d);
  };
  const today = days[back(0)] ?? { min: 0, n: 0 };
  let week = 0;
  for (let i = 0; i < 7; i++) week += days[back(i)]?.min ?? 0;
  // a streak counts back from today, or from yesterday if today has nothing yet
  let streak = 0;
  for (let i = today.n ? 0 : 1; i <= KEEP_DAYS; i++) {
    if (days[back(i)]?.n) streak++;
    else break;
  }
  return { today, week, streak };
}
