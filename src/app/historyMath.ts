// The pure maths behind the History page: heatmap, totals, streaks, hours, top moods.
// Nothing here touches the store or localStorage, so it is easy to test.

import { dayKey } from "../lib/util";
import { dayTotals } from "./statsMath";
import type { SessionRec } from "./statsMath";

export interface HeatCell {
  day: string; // YYYY-MM-DD
  min: number;
  n: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean; // after today (pads the last week)
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Heat level 0–4 for a day's minutes, against the daily goal (or 60 min if there is none). */
export function heatLevel(min: number, goal: number): 0 | 1 | 2 | 3 | 4 {
  if (min <= 0) return 0;
  const g = goal > 0 ? goal : 60;
  const f = min / g;
  return f < 0.34 ? 1 : f < 0.67 ? 2 : f < 1 ? 3 : 4;
}

/** The last `weeks` weeks as columns of 7 days, Monday first, ending with this week. */
export function heatmap(recs: SessionRec[], goal: number, now = new Date(), weeks = 53): HeatCell[][] {
  const days = dayTotals(recs);
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -(mondayOffset + (weeks - 1) * 7));
  const cols: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const key = dayKey(date);
      const v = days[key] ?? { min: 0, n: 0 };
      col.push({ day: key, min: v.min, n: v.n, level: heatLevel(v.min, goal), future: date.getTime() > today.getTime() });
    }
    cols.push(col);
  }
  return cols;
}

/** Minutes and sessions in the `n` days up to and including today. */
export function lastDays(recs: SessionRec[], n: number, now = new Date()): { min: number; n: number } {
  const days = dayTotals(recs);
  let min = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const v = days[dayKey(addDays(now, -i))];
    if (v) {
      min += v.min;
      count += v.n;
    }
  }
  return { min, n: count };
}

/** Minutes and sessions so far this calendar month. */
export function thisMonth(recs: SessionRec[], now = new Date()): { min: number; n: number } {
  const days = dayTotals(recs);
  const prefix = dayKey(now).slice(0, 7);
  let min = 0;
  let n = 0;
  for (const [k, v] of Object.entries(days)) {
    if (k.startsWith(prefix)) {
      min += v.min;
      n += v.n;
    }
  }
  return { min, n };
}

/** The longest run of days in a row with at least one session. */
export function longestStreak(recs: SessionRec[]): number {
  const keys = Object.keys(dayTotals(recs)).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12);
    run = prev && Math.round((date.getTime() - prev.getTime()) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

/** Minutes started in each hour of the day (24 numbers). */
export function byHour(recs: SessionRec[]): number[] {
  const hours = new Array<number>(24).fill(0);
  for (const r of recs) hours[new Date(r.start).getHours()] += r.min;
  return hours;
}

export interface Top {
  name: string;
  min: number;
  n: number;
}

/** The most used moods and raags/tracks, by minutes. */
export function topItems(recs: SessionRec[], pick: (r: SessionRec) => string | null, limit = 5): Top[] {
  const map = new Map<string, Top>();
  for (const r of recs) {
    const name = pick(r);
    if (!name) continue;
    const t = map.get(name) ?? { name, min: 0, n: 0 };
    t.min += r.min;
    t.n += 1;
    map.set(name, t);
  }
  return [...map.values()].sort((a, b) => b.min - a.min || b.n - a.n).slice(0, limit);
}

/** Total minutes ever kept in the log. */
export const totalMin = (recs: SessionRec[]) => recs.reduce((s, r) => s + r.min, 0);

/** Today's progress toward the goal, 0..1 (0 when there is no goal). */
export function goalFraction(todayMin: number, goal: number): number {
  return goal > 0 ? Math.min(1, todayMin / goal) : 0;
}
