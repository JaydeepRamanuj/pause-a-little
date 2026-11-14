# Handoff

The latest handoff is at the top. Each phase session adds its own section above the previous one.

---

## Handoff 2 → Phase 3

**Built (Phase 2, groundwork and honest stats):**

- Split `src/app/session.ts` (1150 lines) into `timer.ts`, `sound.ts`, `words.ts`, `stats.ts` and a new `ui.ts`
  (toast, wake lock, zen, clean screen, sheet, palette/mandala/visual setters). `session.ts` is now a thin file:
  `export *` from all of them plus `boot()`. Components still import from `app/session`; no behaviour change.
- Pure, tested maths in `src/app/timerMath.ts` (`phaseFor`, `messageIndex`, `partialMinutes`) and
  `src/app/statsMath.ts` (`SessionRec`, `migrateLegacy`, `trimHistory`, `dayTotals`, `computeStats`, `MIN_PARTIAL`, `KEEP_DAYS`).
  `currentPhase()` in `timer.ts` now just calls `phaseFor`.
- Vitest added (`npm test`, node env); 18 tests in `src/app/__tests__/`.
- New session log, key `drift:sessions`: array of `{start, min, intent, mode, mood, track, completed, legacy?}`.
  `stats.ts`: `loadSessions()`, `logSession(rec)` (returns today's count), `refreshStats()`, `hm()`.
  Migration: the first time `drift:sessions` is absent, `drift:log` (per-day `{min, n}`) becomes `n` records per day at noon
  (`legacy: true`, `mode: null`); the old key is left untouched.
- Partial sessions: `timer.ts` keeps a module-level `live` record (start, intent, active ms). `reset()` (also reached via
  `setMinutes`) and `pagehide` call `endEarly()`, which logs the real active time if ≥ 5 min (`completed: false`).
  A finished session logs the planned minutes (`completed: true`). 365 days kept (was 120).
- `.gitignore`: `tsconfig.tsbuildinfo` (it had been committed; removed from the index). README updated (layout, `npm test`, history note).

**Decisions:** "pausing for good" can't be detected, so a paused session is logged when it is reset or the tab closes
(pause itself logs nothing, and resuming continues the same record). Active time is summed over running spans, so it works with
"no timer" (0 min) too. Pure maths lives in separate `*Math.ts` files so tests don't import the store/audio (no jsdom needed).
Intent is captured when the session first starts.

**Verified:** `npm run build`, `npm test` (18 pass); Playwright with a fake clock: legacy log migrated (3 records, 75 min,
old key kept); 3 min + reset not logged; 6 min + reset logged `completed:false`; full 20 min logged `completed:true`;
status "Session 2 today"; no page errors; settings sheet checked at 1280×800 and 390×844.

**Known issues / not done:** nothing reads `intent`/`mode`/`mood`/`track` yet (Phase 4 History will). Phase 1's beat swell /
last-minutes brightening still not visually checked. Stats card still only shows today / week / streak.

**Gotchas:** the modules import each other in a cycle (timer ↔ sound ↔ ui ↔ words ↔ stats); fine because everything is called at
runtime, but don't use imported values at module top level. `hooks.*` for the music engine are set at the top of `sound.ts`
and the `visibilitychange` listener in `ui.ts`, so those modules must stay imported (they are, via `session.ts`).
The sound module no longer has a local `toast`; import it from `./ui`. For Phase 3 cycles, the timer's `finish()` and `start()`
in `timer.ts` are where a phase (focus/break) would hook in; `soundDetail()` in `sound.ts` gives mood/track for the log.

**Next:** Phase 3 in docs/PLAN.md.

---

## Handoff 1 → Phase 2

**Built (Phase 1, spinning mandalas):**

- `src/components/mandalas.ts`: every design now uses `spin(level, reverse)` rings (`.m-ring`, per-ring `--d`
  turn time 64–220 s and `--dir`). Levels: 1 outermost/slowest … 4 innermost. Kolam's whole grid and Rangoli's
  star rings (each ring its own speed/direction) now spin too.
- `src/index.css`: `.m-ring`, `.m-body` (600 s whole-body turn), `.m-bloom` replace `.m-spin-a/b`; reduced-motion block updated.
- `src/components/Scene.tsx`: `Mandala` rebuilt: blurred centre glow, playback-rate easing, brighten, bloom, beat swell.
- `src/lib/mandalaFx.ts` (new): **breathing hook** — `setMandalaBreath(v)` (1 = normal, call per frame) and `setMandalaBeat(v)`.
  They set CSS vars `--m-breath` / `--m-beat` on the mandala root, which scales via the `scale` property.
- `src/lib/store.ts`, `src/app/session.ts`, `src/components/SettingsPanel.tsx`: `mandalaSpin` setting
  (Still 0 / Slow 0.5 / Flowing 1 / Lively 2.2, key `raag:spin`), Settings → Screen chips.
- `src/App.tsx`: derives the rate (×0.04 paused, ×0.6 done), the last-3-minutes lift, a done counter for the bloom, and a raag-running beat flag.
- `README.md`: mandala section.

**Decisions:** instead of one `--m-speed` CSS variable (CSS animation durations can't be eased smoothly), the speed is
applied as `Animation.playbackRate` on the `spin` animations, eased each frame, so speed changes and pause glide.
Beat swell in Raag uses a separate `mandalaBeat` prop so the canvas background's beat behaviour is unchanged.

**Verified:** `npm run build`; Playwright at 1280×800 and 390×844: 7 spin animations on Peacock, rate 1 running → ~0.04 after pausing, no page errors.

**Known issues / not done:** beat swell and the last-minutes brightening/bloom were not visually checked (no audio / a 3-minute wait in the sandbox); the bloom remounts the SVG (`key={bloom}`) which restarts ring angles. The mandala only shows in Raag mode (unchanged). No lint/test setup yet.

**Gotchas:** don't toggle `animation-play-state` for the mandala; use the rate. If a new design adds spinning groups, use `spin()` so the rate applies. `useDoneCount` in `App.tsx` mutates refs during render (fine, but keep it simple).

**Next:** Phase 2 in docs/PLAN.md.

---

## Handoff 0 → Phase 1 (planning)

**State:** nothing from `docs/PLAN.md` is built yet. The app is a Vite + React 19 + Tailwind 4 +
`motion` PWA. The codebase was surveyed; findings:

- `src/app/session.ts` is the single controller (timer, sound, music queue, words, stats).
  Stats are logged only in `finish()` → `logSession()`; pause/reset log nothing.
  `drift:log` is per-day `{min, n}`, trimmed to 120 days.
- Mandalas: `src/components/mandalas.ts` builds 8 SVG designs as strings (constants only, injected
  via `dangerouslySetInnerHTML` in `Scene.tsx` → `Mandala`). Animation classes `m-spin-a`
  (150 s), `m-spin-b` (180 s reverse), `m-breathe`, `m-shimmer`, `m-pulse`, `m-draw` live in
  `src/index.css` from ~line 151, with a `prefers-reduced-motion` block at the bottom.
  Kolam has no spin; Rangoli spins only its inner petals. Opacity 0.12 / 0.14 (dark / light).
- `Scene.tsx` already has a beat signal (`beatOn`, `beatRef`) used for the canvas background.
- Settings panel: `src/components/SettingsPanel.tsx` (`ScreenSection` is where a spin-speed
  control fits). Store and persisted keys: `src/lib/store.ts` (`persistKeys`).
- No tests, no linter. `npm run build` = `tsc -b --noEmit && vite build`.

**Next:** Phase 1 in `docs/PLAN.md`.
