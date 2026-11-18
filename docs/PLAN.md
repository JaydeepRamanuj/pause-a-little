# Improvement plan

Six phases, done in order, one cloud session per phase. Each session reads this file and
`docs/HANDOFF.md`, does its phase, writes a new handoff, and starts the session for the next phase.

Agreed defaults: focus/short/long break 25/5/15 min, long break every 4th round; partial
sessions are logged after 5+ min; daily goal 2 h. All adjustable in Settings.

## Phase 1 — Mandalas that spin and feel alive

Today (`src/components/mandalas.ts`, `src/index.css` ~line 151): rings turn at 150–180 s per turn
(barely visible); Kolam doesn't spin at all; Rangoli only spins its inner petals; the mandala
sits at 12–14% opacity and ignores the session.

1. Every mandala spins: an outer slow whole-body turn plus per-ring speeds/directions. Kolam and
   Rangoli get real spinning layers.
2. Depth: outer rings slower, inner faster, alternating directions; a soft blurred glow behind
   the centre.
3. Spin speed setting: Still / Slow / Flowing / Lively (Settings → Screen), via one CSS variable
   (e.g. `--m-speed`) that scales every ring's duration.
4. Responds to the session: eases to near-still on pause (no abrupt stop — e.g. animate a
   playback-rate/variable rather than toggling `animation-play-state` hard), brightens slightly
   in the final minutes, one slow bloom on finish, gentle swell with the existing beat signal
   (`beatOn` in `Scene.tsx`) in Raag mode.
5. Breathing hook: expose a way to scale the mandala with a breath value (used in Phase 3).
6. Keep `prefers-reduced-motion` respected; check performance on a phone-sized viewport.

Files: `mandalas.ts`, `index.css`, `Scene.tsx`, `SettingsPanel.tsx`, `store.ts`.

## Phase 2 — Groundwork and honest stats

1. Split `src/app/session.ts` (~1150 lines) into `app/timer.ts`, `app/sound.ts`, `app/stats.ts`,
   `app/words.ts` (keep `session.ts` as a thin re-export if that keeps imports simple). No
   behaviour change.
2. Add Vitest; tests for timer math, stats/streaks, phase detection.
3. New session log: start time, minutes, intention, mode, mood/track, completed or ended early.
   Migrate the old `drift:log` (per-day totals) so nothing is lost.
4. Partial sessions count: pausing for good / resetting after ≥5 min logs the real time.
5. Keep a year of history (was 120 days).

## Phase 3 — Focus and break cycles, plus breathing

1. Cycles: focus → short break → … long break every 4th; lengths adjustable; can be switched off
   (single timer like today).
2. Breaks look and sound different: softer palette, lighter mood or drone only, dial colour.
3. Guided breathing on breaks: box (4-4-4-4), 4-7-8, simple slow; ring + mandala (Phase 1 hook)
   grow/shrink, short "breathe in / hold / out" text.
4. Short look-back after a focus session: 1–3 dots + optional note, skippable.
5. Auto-start next setting.

## Phase 4 — History and your data

1. History page (top bar + `H`): year heatmap, week/month totals, longest streak, by-hour chart,
   top moods/raags, session list with intentions and notes.
2. Daily goal ring around the timer dial.
3. Export / import everything (settings, saved tracks, history) as one JSON file.

## Phase 5 — Feeling like a real app

1. Media Session API: lock screen / headphone / media keys, title + artwork.
2. End-of-session notification when hidden; permission asked on first session start only.
3. Saved setups ("Deep work", "Evening riyaz"): time, mood/track, palette, mandala, words.
4. Clock-only full-screen mode.

## Phase 6 — Sound extras

1. Ambient layer mixer (rain, ocean, bells, pads, tanpura), each with its own volume.
2. Sleep fade-out timer (15/30/60 min), works without a focus session.
3. Raag details (prahar, thaat, mood) beside raag tracks.

## Working rules for every phase session

- Branch: `claude/app-feature-ideas-lxl7sx` only. Pull it first; push with
  `git push -u origin claude/app-feature-ideas-lxl7sx`. Do not open a pull request.
- `npm install`, then `npm run build` (typecheck + build) must pass; from Phase 2 on `npm test` too.
- Check the change in the real app (Chromium + Playwright are preinstalled; `npm run dev`),
  screenshots at a desktop and a phone size. Send key screenshots to the user with SendUserFile.
- Keep the code style: small comments in plain English, Tailwind classes, the store in
  `src/lib/store.ts`, persisted keys via `persist()`. Respect `prefers-reduced-motion`.
- Update `README.md` (features, keyboard table) when behaviour changes.
- Don't put model names in commits or files.
