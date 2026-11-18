// The pure part of the timer: which words phase it is, and which status message to show.

import type { Phase } from "../data/words";
import type { TimerState } from "../lib/store";

/** Where the session is, for choosing a line: start, middle, end or done. */
export function phaseFor(timer: TimerState, minutes: number, remaining: number): Phase | null {
  if (timer === "done") return "done";
  if (timer !== "running" || !minutes) return null;
  const dur = minutes * 60000,
    f = (dur - remaining) / dur;
  if (f < 0.1) return "start";
  if (remaining <= Math.min(180000, dur * 0.2)) return "end";
  if (f > 0.45 && f < 0.62) return "mid";
  return null;
}

/** The status message changes every two minutes. */
export function messageIndex(durationMs: number, remaining: number): number {
  return Math.floor((durationMs - remaining) / 120000);
}

/**
 * Minutes to log for a session that stopped early: the real time spent, or 0 when it
 * was too short to count.
 */
export function partialMinutes(activeMs: number, minimum: number): number {
  const m = Math.round(activeMs / 60000);
  return m >= minimum ? m : 0;
}
