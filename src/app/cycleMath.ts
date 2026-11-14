// The pure part of focus and break cycles: which block comes next and how long it lasts.

import type { BreathId } from "./breathMath";

export type Block = "focus" | "short" | "long";

export interface CycleSettings {
  on: boolean; // off = a single timer, as before
  shortMin: number; // short break, minutes
  longMin: number; // long break, minutes
  every: number; // a long break after this many focus sessions
  auto: boolean; // start the next block by itself
  breathing: BreathId | "off"; // the guide shown on breaks
  lookBack: boolean; // ask how the session went
}

export const DEFAULT_CYCLE: CycleSettings = {
  on: true,
  shortMin: 5,
  longMin: 15,
  every: 4,
  auto: false,
  breathing: "slow",
  lookBack: true,
};

const clamp = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

/** Read saved settings safely: anything missing or odd falls back to the default. */
export function normalizeCycle(raw: Partial<CycleSettings> | null | undefined): CycleSettings {
  const r = raw ?? {};
  const d = DEFAULT_CYCLE;
  const breathing = ["box", "478", "slow", "off"].includes(String(r.breathing)) ? (r.breathing as CycleSettings["breathing"]) : d.breathing;
  return {
    on: typeof r.on === "boolean" ? r.on : d.on,
    shortMin: clamp(r.shortMin, 1, 60, d.shortMin),
    longMin: clamp(r.longMin, 1, 90, d.longMin),
    every: clamp(r.every, 2, 8, d.every),
    auto: typeof r.auto === "boolean" ? r.auto : d.auto,
    breathing,
    lookBack: typeof r.lookBack === "boolean" ? r.lookBack : d.lookBack,
  };
}

/** `round` counts the focus sessions finished since the last long break. */
export const roundAfterFocus = (round: number) => round + 1;

/** The break that follows a finished focus session (`round` already counts it). */
export const breakAfter = (round: number, every: number): Block => (round >= every ? "long" : "short");

/** A long break starts the cycle again; a short one keeps counting. */
export const roundAfterBreak = (block: Block, round: number) => (block === "long" ? 0 : round);

export function blockMinutes(block: Block, focusMin: number, c: CycleSettings): number {
  return block === "focus" ? focusMin : block === "short" ? c.shortMin : c.longMin;
}

export const blockLabel = (block: Block) => (block === "focus" ? "Focus" : block === "short" ? "Short break" : "Long break");
