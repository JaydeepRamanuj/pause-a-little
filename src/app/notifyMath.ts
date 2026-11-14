// The words of the end-of-session notification. Pure, so the wording can be tested.

import type { Block } from "./cycleMath";

export interface Note {
  title: string;
  body: string;
}

/** What to say when a block ends. `next` is the block waiting (focus, short or long). */
export function endNote(finished: Block, next: Block, minutes: number, n: number): Note {
  if (finished === "focus") {
    const done = minutes ? `${minutes} minutes of focus` : "Your session";
    if (next === "focus") return { title: "Time’s up", body: `${done} — take a breath.` };
    return {
      title: "Time to pause a little",
      body: `${done}${n > 1 ? ` (session ${n} today)` : ""}. A ${next === "long" ? "long" : "short"} break is waiting.`,
    };
  }
  return { title: "Break over", body: "Ready to focus again when you are." };
}
