// Saved setups: the time, cycle, sound, colours, mandala and words, kept under a name.

import { getState, persist, setState } from "../lib/store";
import { load } from "../lib/storage";
import { persistKeys } from "../lib/store";
import { applySound } from "./sound";
import { removeSetup, upsertSetup, type SetupSnapshot } from "./setupMath";
import { reset, setCycle, setMinutes } from "./timer";
import { setMandala, setPalette, setSheet, toast } from "./ui";
import { setWords } from "./words";
import type { MandalaId } from "../components/mandalas";
import type { Lang } from "../data/words";

/** Save the current settings under a name (the same name replaces the old one). */
export function saveSetup(name: string) {
  const s = getState();
  const snap: SetupSnapshot = {
    minutes: s.minutes,
    cycle: s.cycle,
    source: s.source,
    mood: s.mood,
    track: s.source === "raag" ? (s.musicKey ?? load<string | null>(persistKeys.lastTrack, null)) : null,
    palette: s.palette,
    mandala: s.mandala,
    langs: s.words.langs,
    calm: s.words.calm,
    poems: s.words.poems,
  };
  const setups = upsertSetup(s.setups, name, snap);
  if (setups === s.setups) return;
  persist("setups", setups);
  setState({ setups });
  toast("Setup saved");
}

export function deleteSetup(id: string) {
  const setups = removeSetup(getState().setups, id);
  persist("setups", setups);
  setState({ setups });
}

/** Switch to a setup. The timer is reset (a long enough session so far is still logged); nothing starts. */
export function applySetup(id: string) {
  const u = getState().setups.find((x) => x.id === id);
  if (!u) return;
  reset();
  setCycle(u.cycle);
  applySound(u.source, u.mood, u.track);
  setPalette(u.palette);
  setMandala(u.mandala as MandalaId | "none");
  setWords({ langs: u.langs as Lang[], calm: u.calm, poems: u.poems });
  setMinutes(u.minutes);
  setSheet(false);
  toast(`“${u.name}” is ready · press Space`);
}
