// The words: the lines shown in Motivation view, the languages and personal lines.

import { CALM, PERSONAL, POEMS, poemLang, type Lang } from "../data/words";
import type { Phase } from "../data/words";
import { getState, persist, setState } from "../lib/store";
import type { Line, View, Words } from "../lib/store";
import { pick } from "../lib/util";
import { currentPhase } from "./timer";

let wordsTimer = 0;
let phaseShown = new Set<Phase>();
let recent: string[] = [];

/** A new session starts: its start, middle and end lines can be shown again. */
export function resetPhases() {
  phaseShown = new Set();
}

export function setWords(patch: Partial<Words>) {
  const words = { ...getState().words, ...patch };
  persist("words", words);
  setState({ words });
  recent = [];
}

/** Tap a language to add or remove it. English is always there if nothing else is chosen. */
export function toggleLang(l: Lang) {
  const cur = getState().words.langs;
  const next = cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l];
  setWords({ langs: next.length ? next : ["en"] });
}

/** Focus, Motivation or Off. Calm songs has no motivation texts, so it shows the timer instead. */
export function setView(view: View) {
  persist("view", view);
  setState({ view });
  if (view === "motivation") nextLine(true);
  else {
    clearTimeout(wordsTimer);
    setState({ lineShown: false });
  }
}

// ---------- words ----------

function fillName(s: string) {
  return s.replace(/\{n\}/g, getState().words.name.trim());
}

/** Pick from pools of [weight, items, kind]. A line already shown recently is avoided. */
function choose(
  pools: [number, readonly unknown[], "calm" | "personal" | "poem" | "mine"][],
) {
  const total = pools.reduce((a, p) => a + p[0], 0);
  let r = Math.random() * total;
  let pool = pools[0];
  for (const p of pools) {
    if ((r -= p[0]) <= 0) {
      pool = p;
      break;
    }
  }
  let item: unknown,
    key = "";
  for (let i = 0; i < 12; i++) {
    item = pick(pool[1]);
    key = typeof item === "string" ? item : (item as { text: string }).text;
    if (!recent.includes(key) || pool[1].length <= 1) break;
  }
  recent.push(key);
  if (recent.length > 30) recent.shift();
  return { pool, item };
}

function pickLine(): Line | null {
  const s = getState(),
    w = s.words,
    name = w.name.trim();
  const mine = w.mine
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const english = w.langs.includes("en");
  const others = w.langs.filter((l): l is Exclude<Lang, "en"> => l !== "en");

  // Poems and sayings: English shows all of them (each has an English meaning),
  // otherwise only the chosen languages.
  const poems = w.poems
    ? POEMS.filter((p) => english || (others as Lang[]).includes(poemLang(p)))
    : [];

  const pools: [
    number,
    readonly unknown[],
    "calm" | "personal" | "poem" | "mine",
  ][] = [];
  const ph = currentPhase(s);
  if (english && w.calm) {
    // the phase lines (start, middle, end, done) are English only
    if (ph && !phaseShown.has(ph)) {
      phaseShown.add(ph);
      const src = name && Math.random() < 0.6 ? PERSONAL[ph] : CALM[ph];
      return { text: fillName(pick(src)) };
    }
    pools.push([name ? 2 : 3, CALM.any, "calm"]);
    if (name) pools.push([1.6, PERSONAL.any, "personal"]);
  }
  if (poems.length) pools.push([english ? 3 : 3, poems, "poem"]);
  if (mine.length) pools.push([pools.length ? 1.2 : 3, mine, "mine"]);
  // a language with no poems or sayings of its own shows nothing, rather than English
  if (!english && !pools.length) return null;
  if (!pools.length) pools.push([1, CALM.any, "calm"]);

  const { pool, item } = choose(pools);
  if (pool[2] === "poem") {
    const p = item as { text: string; mean: string; by: string };
    return { text: p.text, mean: p.mean, by: p.by, poem: true };
  }
  return { text: fillName(String(item)) };
}

/** Show the next line, after the current one has faded. */
export function nextLine(soon = false) {
  clearTimeout(wordsTimer);
  if (getState().view !== "motivation") return;
  const wasShown = getState().lineShown;
  setState({ lineShown: false });
  const delay = wasShown ? 2700 : soon ? 400 : 50;
  wordsTimer = window.setTimeout(() => {
    const s = getState();
    if (s.view !== "motivation" || s.source === "songs") return;
    const line = pickLine();
    if (line) setState({ line, lineShown: true });
    wordsTimer = window.setTimeout(() => nextLine(false), s.words.speed * 1000);
  }, delay);
}

