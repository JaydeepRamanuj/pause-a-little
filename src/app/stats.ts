// Stats: the session log in localStorage, and the numbers shown in Settings.
// The maths is in statsMath.ts.

import { load, save } from "../lib/storage";
import { setState } from "../lib/store";
import { computeStats, migrateLegacy, trimHistory } from "./statsMath";
import type { OldLog, SessionRec } from "./statsMath";

const KEY = "drift:sessions";

/** The logged sessions. The first time, the old per-day log (`drift:log`) is carried over. */
export function loadSessions(): SessionRec[] {
  const saved = load<SessionRec[] | null>(KEY, null);
  if (Array.isArray(saved)) return saved;
  const migrated = migrateLegacy(load<OldLog>("drift:log", {}));
  save(KEY, migrated); // the old key is left in place, untouched
  return migrated;
}

/** Add a session to the log and return how many sessions today has. */
export function logSession(rec: SessionRec): number {
  const recs = trimHistory([...loadSessions(), rec]);
  save(KEY, recs);
  return computeStats(recs).today.n;
}

export function refreshStats() {
  setState({ stats: computeStats(loadSessions()) });
}

/** Minutes as the stats card shows them: 45m, 2h 5m. */
export const hm = (m: number) =>
  m >= 60
    ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + "m" : ""}`.trim()
    : `${m}m`;
