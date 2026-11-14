# Handoff

The latest handoff is at the top. Each phase session adds its own section above the previous one.

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
