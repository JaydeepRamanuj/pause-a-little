// The focus timer: start, pause, reset, the tick, and logging the session when it ends.
// It starts and stops the sound, and asks the words to show a line.

import { ambient } from "../audio/ambient";
import { bell } from "../audio/music";
import type { Phase } from "../data/words";
import { getState, persist, setState } from "../lib/store";
import type { State } from "../lib/store";
import { cancelPreview, soundDetail, soundStart, soundStop } from "./sound";
import { annotateSession, logSession, refreshStats } from "./stats";
import { blockLabel, blockMinutes, breakAfter, roundAfterBreak, roundAfterFocus } from "./cycleMath";
import type { CycleSettings } from "./cycleMath";
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
let autoTimer = 0; // the pending "start the next block by itself"

/** The length of the block the timer is on: focus, or a break. */
const durationMs = () => {
  const s = getState();
  return blockMinutes(s.cycle.on ? s.block : "focus", s.minutes, s.cycle) * 60000;
};
const onBreak = () => getState().block !== "focus";

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
  clearTimeout(autoTimer);
  if (s.timer === "idle" || s.timer === "done") {
    resetPhases();
    live = null;
  }
  // only focus time is logged; breaks are not
  if (s.block === "focus") {
    live ??= { startedAt: Date.now(), intent: s.intent, activeMs: 0, runFrom: 0 };
    live.runFrom = Date.now();
  }
  const remaining = s.timer === "done" ? durationMs() : s.remaining;
  endAt = Date.now() + remaining;
  msgIdx = messageIndex(durationMs(), remaining);
  setState({
    timer: "running",
    remaining,
    zen: false,
    lookBack: null,
    status: s.block === "focus" ? MESSAGES[msgIdx % MESSAGES.length] : blockLabel(s.block),
  });
  clearInterval(tickIv);
  if (durationMs()) tickIv = window.setInterval(tick, 250);
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
  const remaining = durationMs() ? Math.max(0, endAt - Date.now()) : 0;
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
  clearTimeout(autoTimer);
  endEarly();
  soundStop();
  resetPhases();
  // a reset starts the cycle again from a fresh focus session
  setState({ block: "focus", round: 0, lookBack: null });
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
  if (m !== msgIdx && !onBreak()) {
    msgIdx = m;
    setState({ status: MESSAGES[m % MESSAGES.length] });
  }
  setState({ remaining });
}

function finish() {
  clearInterval(tickIv);
  const before = getState();
  const source = before.source;
  soundStop(6);
  if (source === "ambient") ambient.chime();
  else bell();
  try {
    navigator.vibrate?.([180, 120, 180]);
  } catch {
    /* not supported */
  }
  const c = before.cycle;
  if (before.block !== "focus") {
    // a break is over: back to focus, nothing to log
    const round = roundAfterBreak(before.block, before.round);
    setState({ timer: "done", block: "focus", round, remaining: blockMinutes("focus", before.minutes, c) * 60000, status: "Break over · ready to focus", zen: false });
    keepAwake(false);
    nextLine(true);
    scheduleAuto();
    return;
  }
  const min = Math.round(durationMs() / 60000);
  // the finished session is logged in full
  live ??= { startedAt: Date.now() - min * 60000, intent: before.intent, activeMs: 0, runFrom: 0 };
  const d = soundDetail();
  const startedAt = live.startedAt;
  const n = logSession({
    start: startedAt,
    min,
    intent: live.intent,
    mode: source,
    mood: d.mood,
    track: d.track,
    completed: true,
  });
  live = null;
  if (c.on) {
    const round = roundAfterFocus(before.round);
    const next = breakAfter(round, c.every);
    setState({
      timer: "done",
      block: next,
      round,
      remaining: blockMinutes(next, before.minutes, c) * 60000,
      lookBack: c.lookBack ? startedAt : null,
      status: `Session ${n} done · ${next === "long" ? "long" : "short"} break next`,
      zen: false,
    });
  } else {
    setState({
      timer: "done",
      remaining: 0,
      status: n > 1 ? `Session ${n} today · take a breath` : "Time’s up · take a breath",
      zen: false,
    });
  }
  keepAwake(false);
  refreshStats();
  nextLine(true);
  if (c.on) scheduleAuto();
}

/** With auto-start on, the next block begins by itself, after the sound has faded. */
function scheduleAuto() {
  clearTimeout(autoTimer);
  const s = getState();
  if (!s.cycle.on || !s.cycle.auto) return;
  const wait = s.lookBack != null ? 20000 : 6500; // give the look-back card time
  autoTimer = window.setTimeout(() => {
    if (getState().timer === "done") start();
  }, wait);
}

/** The look-back card: save how it felt (and a note), or skip with nothing. */
export function answerLookBack(feel?: 1 | 2 | 3, note?: string) {
  const at = getState().lookBack;
  if (at == null) return;
  const text = note?.trim().slice(0, 140);
  if (feel || text) {
    annotateSession(at, { ...(feel ? { feel } : {}), ...(text ? { note: text } : {}) });
  }
  setState({ lookBack: null });
  if (getState().cycle.auto) scheduleAutoSoon();
}

function scheduleAutoSoon() {
  clearTimeout(autoTimer);
  autoTimer = window.setTimeout(() => {
    if (getState().timer === "done") start();
  }, 1200);
}

/** Skip the break (or the one waiting): back to a fresh focus session, keeping the round. */
export function skipBreak() {
  const s = getState();
  if (s.block === "focus") return;
  clearInterval(tickIv);
  clearTimeout(autoTimer);
  soundStop();
  keepAwake(false);
  const round = roundAfterBreak(s.block, s.round);
  setState({ block: "focus", round, timer: "idle", lookBack: null, zen: false, status: "Ready when you are" });
  setState({ remaining: durationMs() });
  wake();
}

/** Change the cycle settings. Switching cycles off while on a break returns to plain focus. */
export function setCycle(patch: Partial<CycleSettings>) {
  const cycle = { ...getState().cycle, ...patch };
  persist("cycle", cycle);
  setState({ cycle });
  const s = getState();
  if (patch.on === false && s.block !== "focus") return reset();
  if (s.timer === "idle") setState({ remaining: durationMs() });
  else if (s.timer === "done" && patch.on === false) reset();
}

export function currentPhase(s: State): Phase | null {
  // a break has no focus lines, except the one after a finished session
  if (s.block !== "focus" && s.timer !== "done") return null;
  return phaseFor(s.timer, s.minutes, s.remaining);
}

export function setIntent(v: string) {
  const intent = v.slice(0, 60);
  persist("intent", intent);
  setState({ intent });
}

