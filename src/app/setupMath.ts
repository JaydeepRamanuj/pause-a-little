// Saved setups ("Deep work", "Evening riyaz"): pure helpers, no store, so they are easy to test.

import type { CycleSettings } from "./cycleMath";
import { normalizeCycle } from "./cycleMath";
import type { Source } from "../lib/store";

export interface Setup {
  id: string;
  name: string;
  minutes: number;
  cycle: CycleSettings;
  source: Source;
  mood: string;
  track: string | null; // a fixed or saved raag track key, if one was playing
  palette: string;
  mandala: string;
  langs: string[];
  calm: boolean;
  poems: boolean;
}

export const MAX_SETUPS = 12;
const SOURCES = ["ambient", "raag", "songs"];

/** What a new setup is made from: the current settings. */
export type SetupSnapshot = Omit<Setup, "id" | "name">;

export const cleanName = (name: string) => name.replace(/\s+/g, " ").trim().slice(0, 24);

/** Add a setup, or replace the one with the same name (ignoring case). The newest goes last. */
export function upsertSetup(list: Setup[], name: string, snap: SetupSnapshot): Setup[] {
  const n = cleanName(name);
  if (!n) return list;
  const same = list.find((s) => s.name.toLowerCase() === n.toLowerCase());
  const setup: Setup = { ...snap, id: same?.id ?? `${Date.now().toString(36)}${list.length}`, name: n };
  const rest = list.filter((s) => s !== same);
  return [...rest, setup].slice(-MAX_SETUPS);
}

export const removeSetup = (list: Setup[], id: string) => list.filter((s) => s.id !== id);

/** Read saved setups back, dropping anything broken (older or edited data). */
export function normalizeSetups(raw: unknown): Setup[] {
  if (!Array.isArray(raw)) return [];
  const out: Setup[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Partial<Setup>;
    const name = typeof o.name === "string" ? cleanName(o.name) : "";
    if (!name || typeof o.id !== "string" || !SOURCES.includes(o.source as string)) continue;
    out.push({
      id: o.id,
      name,
      minutes: Math.min(180, Math.max(0, Math.round(Number(o.minutes)) || 0)),
      cycle: normalizeCycle(o.cycle),
      source: o.source as Source,
      mood: typeof o.mood === "string" ? o.mood : "drift",
      track: typeof o.track === "string" ? o.track : null,
      palette: typeof o.palette === "string" ? o.palette : "dawn",
      mandala: typeof o.mandala === "string" ? o.mandala : "lotus",
      langs: Array.isArray(o.langs) ? o.langs.filter((l): l is string => typeof l === "string") : ["en"],
      calm: o.calm !== false,
      poems: o.poems !== false,
    });
  }
  return out.slice(0, MAX_SETUPS);
}
