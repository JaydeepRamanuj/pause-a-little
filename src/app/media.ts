// The Media Session: lock screen, headphone buttons and media keys show what is playing and
// can start, pause and skip. It follows the store, and only touches the browser when
// something it shows has changed.

import { subscribe, getState } from "../lib/store";
import { blockMinutes } from "./cycleMath";
import { mediaInfo } from "./mediaMath";
import { soundTitle, step } from "./sound";
import { pause, start } from "./timer";

const ART = [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
];

export function setupMedia() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const ms = navigator.mediaSession;
  const on = (action: MediaSessionAction, fn: () => void) => {
    try {
      ms.setActionHandler(action, fn);
    } catch {
      /* this browser does not know the action */
    }
  };
  on("play", start);
  on("pause", pause);
  on("stop", pause);
  on("nexttrack", () => step(1));
  on("previoustrack", () => step(-1));

  let last = "";
  const update = () => {
    const s = getState();
    const onBreak = s.cycle.on && s.block !== "focus";
    const title = soundTitle();
    const key = [s.timer, s.block, s.source, s.musicKey, s.mood, s.intent, s.minutes, title].join("|");
    if (key === last) return;
    last = key;
    if (s.timer === "idle") {
      ms.metadata = null;
      ms.playbackState = "none";
      return;
    }
    const info = mediaInfo(title, s.intent, onBreak, s.minutes);
    ms.metadata = new MediaMetadata({ ...info, artwork: ART });
    ms.playbackState = s.timer === "running" ? "playing" : "paused";
    // a progress bar for the block, when it has a length
    const total = blockMinutes(s.cycle.on ? s.block : "focus", s.minutes, s.cycle) * 60;
    try {
      if (total > 0 && s.timer !== "done") {
        const left = Math.max(0, Math.min(total, s.remaining / 1000));
        ms.setPositionState({ duration: total, position: total - left, playbackRate: 1 });
      } else ms.setPositionState();
    } catch {
      /* position state is optional */
    }
  };
  subscribe(update);
  update();
}
