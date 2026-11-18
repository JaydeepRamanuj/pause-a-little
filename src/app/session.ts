// The session controller, split by job. Components import from here; each part lives in its own file:
//   timer.ts  the focus timer       sound.ts  tracks, music, ambient, tanpura
//   words.ts  lines and languages   stats.ts  the session log and totals
//   ui.ts     toasts, zen, sheets and look settings

import { setDroneKey } from "../audio/music";
import { praharNow } from "../data/palettes";
import { getState, setState } from "../lib/store";
import { refreshStats } from "./stats";
import { nextLine } from "./words";
import { setupMedia } from "./media";

export * from "./sound";
export * from "./timer";
export * from "./words";
export * from "./stats";
export * from "./ui";
export * from "./data";
export * from "./setups";
export * from "./notify";
export * from "./sleep";

// ---------- start-up ----------

export function boot() {
  setDroneKey(getState().droneKey);
  setState({ prahar: praharNow() });
  refreshStats();
  setupMedia();
  if (getState().view === "motivation") nextLine(true);
}
