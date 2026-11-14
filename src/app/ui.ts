// Chrome around the session: toasts, wake lock, zen mode, the clean screen, the settings
// sheet and the look settings (palette, mandala, visuals).

import { ALL_PALETTE_IDS, praharNow } from "../data/palettes";
import type { MandalaId } from "../components/mandalas";
import type { CalmVisualId } from "../components/calmArt";
import { getState, persist, setState } from "../lib/store";
import type { MandalaSpin, Picker, ShapeStyle, State } from "../lib/store";
import { endPreview } from "./sound";
import { refreshStats } from "./stats";
import { tick } from "./timer";

let toastId = 0;
let toastTimer = 0;
let zenTimer = 0;

export function toast(msg: string) {
  const id = ++toastId;
  setState({ toast: { msg, id } });
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (getState().toast?.id === id) setState({ toast: null });
  }, 2600);
}


// ---------- wake lock, zen, visibility ----------

let wakeLock: WakeLockSentinel | null = null;

export async function keepAwake(on: boolean) {
  try {
    if (on && "wakeLock" in navigator) {
      if (!wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
        });
      }
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    /* wake lock is a nicety */
  }
}

export function scheduleZen() {
  clearTimeout(zenTimer);
  zenTimer = window.setTimeout(() => {
    const s = getState();
    if (s.timer === "running" && !s.sheet) setState({ zen: true });
  }, 4000);
}

/** Any pointer or key activity brings the controls back. */
export function wake() {
  reveal();
  touchControls();
  if (getState().zen) setState({ zen: false });
  if (getState().timer === "running" && !getState().sheet) scheduleZen();
}

document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    getState().timer === "running"
  ) {
    keepAwake(true);
    tick();
  }
});

// ---------- the sheet ----------

/** The Songs panel: the long videos and their songs. */
export function setSongsPanel(open: boolean) {
  setState({ songsOpen: open });
  if (open) clearTimeout(hideTimer);
  else if (getState().clean) reveal();
}

export function setSheet(open: boolean) {
  if (open) {
    refreshStats();
    clearTimeout(zenTimer);
    clearTimeout(hideTimer);
    setState({
      sheet: true,
      zen: false,
      revealed: getState().clean ? true : getState().revealed,
    });
  } else {
    endPreview();
    setState({ sheet: false });
    if (getState().timer === "running") scheduleZen();
  }
}

export function cyclePalette() {
  const i = ALL_PALETTE_IDS.indexOf(getState().palette);
  setPalette(ALL_PALETTE_IDS[(i + 1) % ALL_PALETTE_IDS.length]);
}

export function setPalette(id: string) {
  persist("palette", id);
  setState({ palette: id });
}

export function setMandala(id: MandalaId | "none") {
  persist("mandala", id);
  setState({ mandala: id });
}

export function setSongVisual(id: CalmVisualId) {
  persist("songVisual", id);
  setState({ songVisual: id });
}

export function setMandalaSpin(id: MandalaSpin) {
  persist("mandalaSpin", id);
  setState({ mandalaSpin: id });
}

export function setShapeStyle(id: ShapeStyle) {
  persist("shapeStyle", id);
  setState({ shapeStyle: id });
}

let idleTimer = 0;

/** Activity brings the Focus controls back, and they fade again after about 5 seconds still. */
export function touchControls() {
  if (getState().controlsIdle) setState({ controlsIdle: false });
  clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => setState({ controlsIdle: true }), 5000);
}


export function setRaagMode(mode: State["raagMode"]) {
  persist("raagMode", mode);
  setState({ raagMode: mode });
  toast(
    mode === "auto"
      ? "Following the raga clock"
      : mode === "light"
        ? "Day light"
        : "Night light",
  );
}

export function setPrahar() {
  const p = praharNow();
  if (p !== getState().prahar) setState({ prahar: p });
}

export function setPicker(picker: Picker) {
  setState({ picker });
}

// ---------- clean screen ----------

let hideTimer = 0;

/** Hide the controls, leaving the background, the mandala and the words. */
export function setClean(on: boolean) {
  persist("clean", on);
  clearTimeout(hideTimer);
  setState({ clean: on, revealed: false });
  if (getState().sheet) setState({ revealed: true });
}

export function setCleanClock(on: boolean) {
  persist("cleanClock", on);
  setState({ cleanClock: on });
}

/** Any activity brings the controls back for a few seconds. */
export function reveal() {
  const s = getState();
  if (!s.clean) return;
  if (!s.revealed) setState({ revealed: true });
  clearTimeout(hideTimer);
  // hide again after 6 seconds without activity
  if (!s.sheet && !s.songsOpen)
    hideTimer = window.setTimeout(() => setState({ revealed: false }), 6000);
}

