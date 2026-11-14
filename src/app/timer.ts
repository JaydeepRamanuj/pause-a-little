// The focus timer: start, pause, reset, the tick, and logging the session when it ends.
// It starts and stops the sound, and asks the words to show a line.

import { ambient } from "../audio/ambient";
import { bell } from "../audio/music";
import type { Phase } from "../data/words";
import { getState, persist, setState } from "../lib/store";
import type { State } from "../lib/store";
import { cancelPreview, soundDetail, soundStart, soundStop } from "./sound";
import { logSession, refreshStats } from "./stats";
import { MIN_PARTIAL } from "./statsMath";
import { messageIndex, partialMinutes, phaseFor } from "./timerMath";
import { keepAwake, scheduleZen, wake } from "./ui";
import { nextLine, resetPhases } from "./words";

const MESSAGES = [
  "Breathe. Focus.",
  "One thing at a time",
  "Slow is smooth",
  "Stay with it",
  "Gently, steadily",
];

let endAt = 0;
let tickIv = 0;
let msgIdx = 0;

const durationMs = () => getState().minutes * 60000;

/** The session in progress, kept so it can be logged when it ends (finished or not). */
let live: { startedAt: number; intent: string; activeMs: number; runFrom: number } | null = null;

/** Add the time since the timer last started running to the session's active time. */
function bank() {
  if (live && live.runFrom) {
    live.activeMs += Date.now() - live.runFrom;
    live.runFrom = 0;
  }
}

/** Log a session that stopped before the timer ran out, if it ran long enough. */
function endEarly() {
  if (!live) return;
  bank();
  const min = partialMinutes(live.activeMs, MIN_PARTIAL);
  if (min) {
    const d = soundDetail();
    logSession({
      start: live.startedAt,
      min,
      intent: live.intent,
      mode: getState().source,
      mood: d.mood,
      track: d.track,
      completed: false,
    });
    refreshStats();
  }
  live = null;
}

// closing the tab counts the time spent, so a session is not lost
window.addEventListener("pagehide", () => {
  if (live) endEarly();
});

// ---------- the focus timer ----------

export function start() {
  const s = getState();
  if (s.timer === "running") return;
  cancelPreview();
  if (s.timer === "idle" || s.timer === "done") {
    resetPhases();
    live = null;
  }
  live ??= { startedAt: Date.now(), intent: s.intent, activeMs: 0, runFrom: 0 };
  live.runFrom = Date.now();
  const remaining = s.timer === "done" ? durationMs() : s.remaining;
  endAt = Date.now() + remaining;
  msgIdx = messageIndex(durationMs(), remaining);
  setState({
    timer: "running",
    remaining,
    zen: false,
    status: MESSAGES[msgIdx % MESSAGES.length],
  });
  clearInterval(tickIv);
  if (s.minutes) tickIv = window.setInterval(tick, 250);
  soundStart();
  keepAwake(true);
  scheduleZen();
  if (s.timer !== "paused") nextLine(true);
}

export function pause() {
  const s = getState();
  if (s.timer !== "running") return;
  clearInterval(tickIv);
  bank();
  const remaining = s.minutes ? Math.max(0, endAt - Date.now()) : 0;
  setState({ timer: "paused", remaining, status: "Paused" });
  soundStop();
  keepAwake(false);
  wake();
}

export function toggleSession() {
  if (getState().timer === "running") pause();
  else start();
}

export function reset() {
  clearInterval(tickIv);
  endEarly();
  soundStop();
  resetPhases();
  setState({
    timer: "idle",
    remaining: durationMs(),
    status: "Ready when you are",
    zen: false,
  });
  keepAwake(false);
  wake();
  if (getState().view === "motivation") nextLine(true);
}

export function setMinutes(min: number) {
  const m = Math.min(180, Math.max(0, Math.round(min)));
  persist("minutes", m);
  setState({ minutes: m });
  reset();
}

export function tick() {
  const s = getState();
  if (s.timer !== "running") return;
  const remaining = endAt - Date.now();
  if (remaining <= 0) return finish();
  const m = messageIndex(durationMs(), remaining);
  if (m !== msgIdx) {
    msgIdx = m;
    setState({ status: MESSAGES[m % MESSAGES.length] });
  }
  setState({ remaining });
}

function finish() {
  clearInterval(tickIv);
  const min = Math.round(durationMs() / 60000);
  const source = getState().source;
  soundStop(6);
  if (source === "ambient") ambient.chime();
  else bell();
  try {
    navigator.vibrate?.([180, 120, 180]);
  } catch {
    /* not supported */
  }
  // the finished session is logged in full
  live ??= { startedAt: Date.now() - min * 60000, intent: getState().intent, activeMs: 0, runFrom: 0 };
  const d = soundDetail();
  const n = logSession({
    start: live.startedAt,
    min,
    intent: live.intent,
    mode: source,
    mood: d.mood,
    track: d.track,
    completed: true,
  });
  live = null;
  setState({
    timer: "done",
    remaining: 0,
    status:
      n > 1
        ? `Session ${n} today · take a breath`
        : "Time’s up · take a breath",
    zen: false,
  });
  keepAwake(false);
  refreshStats();
  nextLine(true);
}

export function currentPhase(s: State): Phase | null {
  return phaseFor(s.timer, s.minutes, s.remaining);
}

export function setIntent(v: string) {
  const intent = v.slice(0, 60);
  persist("intent", intent);
  setState({ intent });
}

