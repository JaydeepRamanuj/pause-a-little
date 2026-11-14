# Handoff

The latest handoff is at the top. Each phase session adds its own section above the previous one.

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
