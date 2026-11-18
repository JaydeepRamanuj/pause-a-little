// The sleep timer: plays your sound, then fades it out after 15, 30 or 60 minutes.
// It works with the focus timer idle, so it does not rely on a session finishing.

import { getState, setState } from "../lib/store";
import { sleepFadeSec } from "./layersMath";
import { soundStart, soundStop } from "./sound";
import { toast } from "./ui";

let fadeTimer = 0;
let endTimer = 0;

function clearTimers() {
  clearTimeout(fadeTimer);
  clearTimeout(endTimer);
  fadeTimer = endTimer = 0;
}

/** Start the sound (if it is not already playing) and fade it out after `min` minutes. */
export function startSleep(min: number) {
  const s = getState();
  if (!s.soundOn) {
    toast("Sound is off. Switch it on to use the sleep timer.");
    return;
  }
  clearTimers();
  if (s.timer !== "running") soundStart();
  const fade = sleepFadeSec(min);
  const total = min * 60_000;
  setState({ sleepEnd: Date.now() + total });
  fadeTimer = window.setTimeout(() => soundStop(fade), total - fade * 1000);
  endTimer = window.setTimeout(() => {
    endTimer = 0;
    setState({ sleepEnd: null });
    toast("Sleep timer finished. Sleep well.");
  }, total);
}

/** Cancel the timer. The sound keeps playing unless it had already started to fade. */
export function cancelSleep() {
  clearTimers();
  setState({ sleepEnd: null });
}
